import { Janus } from 'janus-gateway'
const server = process.env.VUE_APP_JANUS_URL

export default {
  namespaced: true,
  state: {
    janus: null,
    plugins: {
      camera: null,
      screen: null,
      recording: null,
      recordingCamera: null,
      recordingcreen: null
    },
    streams: {
      camera: null,
      screen: null,
      recordingCamera: null,
      recordingcreen: null,
    },
    jsep: {
      camera: null,
      screen: null
    },
    error: null,
    status: null,
    streamList: {
      selected: null,
      options: []
    },
    settings: {
      confirmed: false,
      myId: null,
      privateId: null,
      recordingId: null,
      recordingScreenId: null
    },
    rooms: {
      camera: null,
      screen: null
    },
    loaded: {
      janus: false,
      plugins: {
        camera: false,
        screen: false,
        recordingCamera: false,
        recordingScreen: false
      },
      recording: {
        camera: false,
        screen: false
      }
    },
    errors: {
      cameraNotFound: false,
      permissionDenied: false,
      needReload: false
    }

  },
  getters: {
    isActive: (state) => state.streams.camera,
    camerasList: (state) => state.streamList.options,
    streamData: (state) => state.streams.camera,
    selectedCamera: (state) => state.streamList.selected,
    isCameraSubmited: (state) => state.settings.confirmed,
    jsep: (state) => state.jsep.camera,
    completedRoom: (state) => `${state.rooms.camera};${state.rooms.screen}`,
    isJanusLoaded: (state) => state.loaded.janus,
    isPluginLoaded: (state) => (type) => state.loaded.plugins[type],
    recordingLoaded: (state) => state.loaded.recording.camera && state.loaded.recording.screen,
    isPermissionDenied: (state) => state.errors.permissionDenied,
    isCameraNotFound: (state) => state.errors.cameraNotFound,
    isNeedReload: (state) => state.errors.needReload,
  },
  mutations: {
    INIT(state) {
      state.streamList.selected = sessionStorage.getItem('current_camera_device')
    },
    CLEAR_STREAM(state) {
      sessionStorage.removeItem('current_camera_device')
      state.streamList.selected = null
      state.janus = null
      state.plugins = {
        camera: null,
        screen: null,
        recording: null
      }
      state.streams = {
        camera: null,
        screen: null,
        recordingCamera: null,
        recordingcreen: null,
      }
    },
    SET_JANUS(state, janus) {
      state.janus = janus
      state.loaded.janus = true
    },
    SET_PLUGIN(state, { type, plugin }) {
      state.plugins[type] = plugin
      state.loaded.plugins[type] = true
    },
    SET_STATUS(state, status) {
      state.status = status
    },
    SET_STREAM(state, { type, stream }) {
      state.streams[type] = stream
    },
    SET_ROOM(state, { type, room }) {
      state.rooms[type] = room
    },
    SET_JSEP(state, { type, jsep }) {
      state.jsep[type] = jsep
    },
    SET_ID(state, { type, id }) {
      state.settings[type] = id
    },
    SET_STREAM_LIST_OPTIONS(state, list) {
      state.streamList.options = list.filter((device) => device.kind === 'videoinput')
    },
    SET_STREAM_LIST_SELECTED(state, option) {
      state.streamList.selected = option
    },
    SAVE_STREAM_LIST_SELECTED(state, option) {
      sessionStorage.setItem('current_camera_device', option)
      state.streamList.selected = option
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_CAMERA_STATUS(state, status) {
      state.settings.confirmed = status
    },
    SET_RECORDING_LOADED(state, type) {
      state.loaded.recording[type] = true
    },
    SET_ERROR(state, errorName) {
      state.errors[errorName] = true
    }
  },
  actions: {
    init({ state, dispatch, commit }, isReconnection = false) {
      Janus.init({
        debug: true,
        dependencies: Janus.useDefaultDependencies(),
        callback: () => {
          dispatch('connect', { isReconnection, server })
        }
      })

    },
    connect({ state, commit, dispatch, rootState, getters }, { isReconnection, server }) {
      const examId = rootState.auth.params.examId

      const janus = new Janus({
        server,
        success: () => {
          commit('SET_JANUS', janus)
          janus.attach({
            plugin: "janus.plugin.videoroom",
            success: function (pluginHandle) {
              commit('SET_PLUGIN', { type: 'camera', plugin: pluginHandle });
              dispatch('updateStreamsList')
              if (isReconnection) {
                dispatch('start', { type: 'camera' })
              }
            },
            onmessage: function (msg, jsep) {
              // Handle msg, if needed, and check jsep
              const event = msg['videoroom']
              if (event) {
                if (event === "joined") {
                  commit('SET_ID', { type: 'myId', id: msg['id'] })

                  Janus.log("Successfully joined room " + msg["room"] + " with ID " + state.settings.myId)
                  if (isReconnection) {
                    dispatch('setRooms', msg["room"])
                  }
                  const video = getters.selectedCamera ? {
                    deviceId: {
                      exact: getters.selectedCamera
                    }
                  } : true
                  state.plugins.camera.createOffer({
                    media: { video, audioSend: false, videoRecv: false },	// Screen sharing Publishers are sendonly
                    success: function (jsep) {
                      Janus.debug("Got publisher SDP!", jsep);
                      state.plugins.camera.send({ message: { request: "configure", audio: true, video: true }, jsep });
                    },
                    error: function (error) {
                      if(error.name === 'NotAllowedError') {
                        commit('SET_ERROR', 'permissionDenied')
                      } else if(error.name === 'NotReadableError') {
                        commit('SET_ERROR', 'cameraNotFound')
                      }
                      Janus.error("WebRTC error:", error);
                    }
                  });
                }
              }
              if (jsep !== undefined && jsep !== null) {
                // We have the ANSWER from the plugin
                commit('SET_JSEP', { type: 'camera', jsep })

                state.plugins.camera.handleRemoteJsep({ jsep });
              }
            },
            onlocalstream: function (stream) {
              commit('SET_STREAM', { type: 'camera', stream })
            },
            // onremotestream: function (stream) {
            //   commit('SET_STREAM', { type: 'camera', stream })
            // },
          })
          janus.attach({
            plugin: "janus.plugin.videoroom",
            success: function (pluginHandle) {
              commit('SET_PLUGIN', { type: 'screen', plugin: pluginHandle });
              if (isReconnection) {
                dispatch('start', { type: 'screen' })
              }
            },
            onmessage: function (msg, jsep) {
              // Handle msg, if needed, and check jsep
              const event = msg['videoroom']
              if (event) {
                if (event === "joined") {
                  commit('SET_ID', { type: 'myId', id: msg['id'] })

                  Janus.log("Successfully joined room " + msg["room"] + " with ID " + state.settings.myId)
                  if (isReconnection) {
                    dispatch('setRooms', msg["room"])
                  }

                  state.plugins.screen.createOffer({
                    media: { video: 'screen', videoSend: true, audioSend: false, videoRecv: false },	// Screen sharing Publishers are sendonly
                    success: function (jsep) {
                      Janus.debug("Got publisher SDP!", jsep);
                      state.plugins.screen.send({ message: { request: "configure", audio: false, video: true }, jsep });
                    },
                    error: function (error) {
                      Janus.error("WebRTC error:", error);
                    }
                  });
                }
              }
              if (jsep !== undefined && jsep !== null) {
                // We have the ANSWER from the plugin
                commit('SET_JSEP', { type: 'screen', jsep })

                state.plugins.screen.handleRemoteJsep({ jsep });
              }
            },
            // onlocalstream: function (stream) {
            //   commit('SET_STREAM', { type: 'screen', stream })
            // },
            // onremotestream: function (stream) {
            //   commit('SET_STREAM', { type: 'screen', stream })
            // },
          })
          janus.attach({
            plugin: "janus.plugin.recordplay",
            success: function (pluginHandle) {
              commit('SET_PLUGIN', { type: 'recordingCamera', plugin: pluginHandle })

              Janus.log("Plugin attached! (" + state.plugins.recordingCamera.getPlugin() + ", id=" + state.plugins.recordingCamera.getId() + ")");
            },
            error: function (error) {
              Janus.error("  -- Error attaching plugin...", error);
            },
            consentDialog: function (on) {
              Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
            },
            iceState: function (state) {
              Janus.log("ICE state changed to " + state);
            },
            mediaState: function (medium, on) {
              Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
            },
            webrtcState: function (on) {
              Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
            },
            onmessage: function (msg, jsep) {
              Janus.debug(" ::: Got a message :::", msg)
              const result = msg["result"]

              if (result) {
                if (result["status"]) {
                  const event = result["status"]

                  if (event === 'preparing' || event === 'refreshing') {
                    Janus.log("Preparing the recording playout")
                    state.plugins.recordingCamera.createAnswer(
                      {
                        jsep,
                        media: { audioSend: false, videoSend: false, data: true },	// We want recvonly audio/video
                        success: function (jsep) {
                          Janus.debug("Got SDP!", jsep)
                          state.plugins.recordingCamera.send({ message: { request: "start" }, jsep })
                        },
                        error: function (error) {
                          Janus.error("WebRTC error:", error)
                        }
                      });
                    if (result["warning"])
                      console.log('warning', result["warning"])
                  } else if (event === 'recording') {
                    // Got an ANSWER to our recording OFFER
                    if (jsep)
                      state.plugins.recordingCamera.handleRemoteJsep({ jsep });
                    const id = result["id"];
                    if (id) {
                      Janus.log("The ID of the current recording is " + id);
                      commit('SET_ID', { type: 'recordingId', id })
                    }
                  } else if (event === 'playing') {
                    Janus.log("Playout has started!");
                  } else if (event === 'stopped') {
                    Janus.log("Session has stopped!");
                    state.plugins.recordingCamera.hangup();
                  }
                }
              } else {
                console.log(error)
                state.plugins.recordingCamera.hangup()
              }
            },
            oncleanup: function () {
              Janus.log(" ::: Got a cleanup notification :::");
            }
          });
          janus.attach({
            plugin: "janus.plugin.recordplay",
            success: function (pluginHandle) {
              commit('SET_PLUGIN', { type: 'recordingScreen', plugin: pluginHandle })

              Janus.log("Plugin attached! (" + state.plugins.recordingScreen.getPlugin() + ", id=" + state.plugins.recordingScreen.getId() + ")");
            },
            error: function (error) {
              Janus.error("  -- Error attaching plugin...", error);
            },
            consentDialog: function (on) {
              Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
            },
            iceState: function (state) {
              Janus.log("ICE state changed to " + state);
            },
            mediaState: function (medium, on) {
              Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
            },
            webrtcState: function (on) {
              Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
            },
            onmessage: function (msg, jsep) {
              Janus.debug(" ::: Got a message :::", msg)
              const result = msg["result"]

              if (result) {
                if (result["status"]) {
                  const event = result["status"]

                  if (event === 'preparing' || event === 'refreshing') {
                    Janus.log("Preparing the recording playout")
                    state.plugins.recordingScreen.createAnswer(
                      {
                        jsep,
                        media: { audioSend: false, videoSend: false, data: false },	// We want recvonly audio/video
                        success: function (jsep) {
                          Janus.debug("Got SDP!", jsep)
                          state.plugins.recordingScreen.send({ message: { request: "start" }, jsep })
                        },
                        error: function (error) {
                          Janus.error("WebRTC error:", error)
                        }
                      });
                    if (result["warning"])
                      console.log('warning', result["warning"])
                  } else if (event === 'recording') {
                    // Got an ANSWER to our recording OFFER
                    if (jsep)
                      state.plugins.recordingScreen.handleRemoteJsep({ jsep });
                    const id = result["id"];
                    if (id) {
                      Janus.log("The ID of the current recording is " + id);
                      commit('SET_ID', { type: 'recordingScreenId', id })
                    }
                  } else if (event === 'playing') {
                    Janus.log("Playout has started!");
                  } else if (event === 'stopped') {
                    Janus.log("Session has stopped!");
                    state.plugins.recordingScreen.hangup();
                  }
                }
              } else {
                console.log(error)
                state.plugins.recordingScreen.hangup()
              }
            },
            oncleanup: function () {
              Janus.log(" ::: Got a cleanup notification :::");
            }
          });

        },
        error: (error) => {
          dispatch('onError', {
            message: 'Failed to connect to janus server',
            error
          })
        },
        destroyed: () => {
          // window.location.reload()
        }
      })
    },
    start({ state, commit, rootState, dispatch }, { type, examType = false }) {
      return new Promise((resolve, reject) => {
        const examId = rootState.auth.params.examId

        if (type === 'camera') {
          state.plugins.camera.send({
            message: {
              request: 'create',
              description: examId,
              bitrate: 500000,
              publishers: 1
            },
            success: (result) => {
              const event = result['videoroom']
              Janus.debug("Event: " + event)

              if (event) {
                // Our own screen sharing session has been created, join it
                commit('SET_ROOM', { type: 'camera', room: result["room"] })

                Janus.log("Camera session created: " + state.rooms.camera);

                state.plugins.camera.send({
                  message: {
                    request: "join",
                    room: state.rooms.camera,
                    ptype: "publisher",
                    display: examId
                  }
                })
                resolve()
              }
            }
          })
        } else if (type === 'screen') {
          state.plugins.screen.send({
            message: {
              request: 'create',
              description: examId,
              bitrate: 500000,
              publishers: 1
            },
            success: (result) => {
              const event = result['videoroom']
              Janus.debug("Event: " + event)

              if (event) {
                // Our own screen sharing session has been created, join it
                commit('SET_ROOM', { type: 'screen', room: result["room"] })

                Janus.log("Screen sharing session created: " + state.rooms.camera);

                state.plugins.screen.send({
                  message: {
                    request: "join",
                    room: state.rooms.screen,
                    ptype: "publisher",
                    display: examId
                  }
                });
                resolve()
              }
            }
          })
        } else if (type === 'recordingCamera') {
          dispatch('stopStream', 'recordingCamera')
          state.plugins.recordingCamera.createOffer(
            {
              media: { data: false },
              success: (jsep) => {
                commit('SET_RECORDING_LOADED', 'camera')
                Janus.debug("Got SDP!", jsep);

                state.plugins.recordingCamera.send({ message: { request: "record", name: `<${examId}_${examType === 'test' ? 't' : 'e'}_k>` }, jsep });
              },
              error: function (error) {
                Janus.error("WebRTC error...", error);
                state.plugins.recordingCamera.hangup();
              }
            });
        } else if (type === 'recordingScreen') {
          dispatch('stopStream', 'recordingScreen')
          state.plugins.recordingScreen.createOffer(
            {
              media: { video: 'screen', data: false },
              success: (jsep) => {
                commit('SET_RECORDING_LOADED', 'screen')
                Janus.debug("Got SDP!", jsep);

                state.plugins.recordingScreen.send({ message: { request: "record", name: `<${examId}_${examType === 'test' ? 't' : 'e'}_s>` }, jsep });
              },
              error: function (error) {
                Janus.error("WebRTC error...", error);
                state.plugins.recordingScreen.hangup();
              }
            });
        }
      })
    },
    updateStreamsList({ state, commit, getters, dispatch }) {
      Janus.listDevices((devices) => {
        if (!devices) {
          dispatch('onError', { message: 'Got no response to our query for available streams' })
        }
        commit('SET_STREAM_LIST_OPTIONS', devices)
        if (devices.length) {
          if (!getters.selectedCamera) {
            commit('SET_STREAM_LIST_SELECTED', state.streamList.options[0].deviceId)
          }

        }
      });
    },
    selectCamera({ state, commit }, { deviceId, save = false }) {
      const replaceVideo = deviceId !== state.streamList.selected
      if (replaceVideo) {
        state.plugins.camera.createOffer({
          media: {
            video: {
              deviceId: {
                exact: deviceId
              }
            },
            replaceVideo
          },
          success: function (jsep) {
            // Got our SDP! Send our OFFER to the plugins.camera
            state.plugins.camera.send({ "message": { video: true }, "jsep": jsep })
            if(save) {
              commit('SAVE_STREAM_LIST_SELECTED', deviceId)
            } else {
              commit('SET_STREAM_LIST_SELECTED', deviceId)
            }
          },
          error: function (error) {
            // An error occurred...
          },
        });
      } else {
        if(save) {
          commit('SAVE_STREAM_LIST_SELECTED', deviceId)
        } else {
          commit('SET_STREAM_LIST_SELECTED', deviceId)
        }
      }
    },

    setRooms({ state, commit, getters, dispatch }, { type = null, room = null }) {
      if (room) {
        commit('SET_ROOM', { type, room })
      }

      const rooms = state.rooms

      if (rooms.camera && rooms.screen) {
        dispatch('auth/appendSession', getters.completedRoom, { root: true })
      }
    },
    clear({ dispatch, commit }) {
      dispatch('stopRooms', 'camera')
      dispatch('stopRooms', 'screen')
      dispatch('stopStream', 'recordingCamera')
      dispatch('stopStream', 'recordingScreen')
      // commit('CLEAR_STREAM')
    },
    stopStream({ state }, type) {
      state.plugins[type].send({ message: { request: 'stop' } })
    },
    stopRooms({state}, type) {
      state.plugins[type].send({ message: { request: 'leave' } })
    },
    onError({ state }, { message }) {
      console.error(message)
    }
  },
}
