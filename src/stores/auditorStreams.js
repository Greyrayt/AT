import { Janus } from 'janus-gateway'

const server = process.env.VUE_APP_JANUS_URL

export default {
  namespaced: true,
  state: {
    janus: null,
    plugins: {
      camera: null,
      videoroom: null,
      videoroom2: null,
      screen: null
    },
    streams: {},
    stream: null,
    streamScreen: null,
    error: null,
    status: null,
    list: [],
    room: null,
    roomScreen: null,
    myId: null,
    records: {
      camera: {
        plugin: null,
        list: [],
        stream: null,
      },
      screen: {
        plugin: null,
        list: [],
        stream: null
      }
    },

  },
  getters: {
    // streamData: (state) => (agentExamId) => state.streams[agentExamId],
    streamData : (state) => state.stream,
    streamScreen: (state) => state.streamScreen,
    streams: (state) => state.streams,
    stream: (state) => (rid) => {
      console.log('stream getter', state.streams[rid])
      return state.streams[rid] || { camera: {}, screen: {} }
    },
    recordStream: (state) => (type) => state.records[type].stream,
    recordsList: (state) => state.records.camera.list
  },
  mutations: {
    SET_JANUS(state, janus) {
      state.janus = janus
    },
    SET_PLUGIN(state, { type, plugin }) {
      state.plugins[type] = plugin
    },
    SET_STREAM(state, stream) {
      state.stream = stream
    },
    SET_SCREEN_STREAM(state, stream) {
      state.streamScreen = stream
    },
    SET_STATUS(state, status) {
      state.status = status
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_LIST(state, list) {
      state.list = list
    },
    SET_ROOM(state, room) {
      const rooms = room.split(';')
      state.room = Number(rooms[0])
      state.roomScreen = Number(rooms[1])
    },
    SET_ID(state, id) {
      state.myId = id
    },
    SET_AUDIT_STREAM(state, { rid, stream }) {
      state.streams[rid] = stream
    },
    SET_AUDIT_STREAM_DATA(state, { rid, type, field, value }) {
      state.streams[rid][type][field] = value
    },
    REACTIVITY_STREAM(state, value) {
      state.streams = value
    },
    RESET_STREAMS(state) {
      state.streams = {}
    },
    SET_RECORD_PLUGIN(state, { type, plugin}) {
      state.records[type].plugin = plugin
    },
    SET_RECORD_LIST(state, { type, list }) {
      state.records[type].list = list
    },
    SET_RECORD_STREAM(state, { type, stream }) {
      state.records[type].stream = stream
    },
  },
  actions: {
    init({ dispatch, commit }, room) {
      commit('SET_ROOM', room)
      Janus.init({
        debug: true,
        dependencies: Janus.useDefaultDependencies(),
        callback: () => {
          dispatch('connect', { server })
        }
      })
    },
    connect({ state, commit, dispatch }, { server }) {
      const janus = new Janus({
        server,
        success: () => {
          commit('SET_JANUS', janus)

          janus.attach({
            plugin: "janus.plugin.videoroom",
            success: (pluginHandle) => {
              commit('SET_PLUGIN', { type: 'camera', plugin: pluginHandle });
              dispatch('start')
            },
            onmessage: function (msg, jsep) {
              // Handle msg, if needed, and check jsep
              const event = msg['videoroom']

              if (event) {
                if (event === 'joined') {
                  commit('SET_ID', msg["id"])
                  Janus.log("Successfully joined room " + msg["room"] + " with ID " + state.myId)
                  if(msg["publishers"]) {
                    commit('SET_LIST', msg["publishers"])
                    Janus.debug("Got a list of available publishers/feeds:", state.list);
                    for (let f in state.list) {
                      const id = state.list[f]["id"]
                      const display = state.list[f]["display"]
                      Janus.debug("  >> [" + id + "] " + display)
                      dispatch('newRemoteFeed', { id, display })
                    }
                  }
                } else if (event) {
                  if (msg["publishers"]) {
                    commit('SET_LIST', msg["publishers"])
                    Janus.debug("Got a list of available publishers/feeds:", state.list);

                    for (let f in state.list) {
                      const id = state.list[f]["id"]
                      const display = state.list[f]["display"]
                      Janus.debug("  >> [" + id + "] " + display)
                      dispatch('newRemoteFeed', { id, display })
                    }
                  } else if (msg["leaving"]) {
                    // One of the publishers has gone away?
                    const leaving = msg["leaving"]
                    Janus.log("Publisher left: " + leaving);
                  } else if (msg["error"]) {
                    console.log(msg["error"])
                  }
                }
              }

              if (jsep !== undefined && jsep !== null) {
                // We have the ANSWER from the plugin
                state.plugins.camera.handleRemoteJsep({ jsep });
              }
            },
            onremotestream: function (stream) {
              commit('SET_STREAM', stream)
            },
          })
          janus.attach({
            plugin: "janus.plugin.videoroom",
            success: (pluginHandle) => {
              commit('SET_PLUGIN', { type: 'screen', plugin: pluginHandle });
              dispatch('startScreen')
            },
            onmessage: function (msg, jsep) {
              // Handle msg, if needed, and check jsep
              const event = msg['videoroom']

              if (event) {
                if (event === 'joined') {
                  commit('SET_ID', msg["id"])
                  Janus.log("Successfully joined room " + msg["room"] + " with ID " + state.myId)
                  if(msg["publishers"]) {
                    commit('SET_LIST', msg["publishers"])
                    Janus.debug("Got a list of available publishers/feeds:", state.list);
                    for (let f in state.list) {
                      const id = state.list[f]["id"]
                      const display = state.list[f]["display"]
                      Janus.debug("  >> [" + id + "] " + display)
                      dispatch('newRemoteFeed', { id, display })
                    }
                  }
                } else if (event) {
                  if (msg["publishers"]) {
                    commit('SET_LIST', msg["publishers"])
                    Janus.debug("Got a list of available publishers/feeds:", state.list);

                    for (let f in state.list) {
                      const id = state.list[f]["id"]
                      const display = state.list[f]["display"]
                      Janus.debug("  >> [" + id + "] " + display)
                      dispatch('newRemoteFeed', { id, display })
                    }
                  } else if (msg["leaving"]) {
                    // One of the publishers has gone away?
                    const leaving = msg["leaving"]
                    Janus.log("Publisher left: " + leaving);
                  } else if (msg["error"]) {
                    console.log(msg["error"])
                  }
                }
              }

              if (jsep !== undefined && jsep !== null) {
                // We have the ANSWER from the plugin
                state.plugins.screen.handleRemoteJsep({ jsep });
              }
            },
            onremotestream: function (stream) {
              commit('SET_SCREEN_STREAM', stream)
            },
          })
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
    start({ state }) {
      state.plugins.camera.send({
        message: {
          request: "join",
          room: state.room,
          ptype: "publisher",
          display: 'Auditor'
        }
      });
    },
    startStreams({ state, commit, dispatch }, exams) {
      exams.forEach((exam) => {
        let rooms = [null, null]
        if(exam.rtcSession) {
          rooms = JSON.parse(exam.rtcSession).split(';')
        }

        const stream = {
          camera: {
            room: Number(rooms[0]),
            plugin: null,
            vPlugin: null,
            media: null,
            id: null,
            publishers: []
          },
          screen: {
            room: Number(rooms[1]),
            plugin: null,
            vPlugin: null,
            media: null,
            id: null,
            publishers: []
          }
        }

        commit('SET_AUDIT_STREAM', { rid: exam.rid, stream })

        dispatch('setStream', { rid:exam.rid, type: 'camera' })
        dispatch('setStream', { rid:exam.rid, type: 'screen' })
      })
    },
    setStream({ state, commit, dispatch }, { rid, type }) {
      state.janus.attach({
        plugin: "janus.plugin.videoroom",
        success: (pluginHandle) => {
          commit('SET_AUDIT_STREAM_DATA', { rid, type, field: 'plugin', value: pluginHandle })
          state.streams[rid][type].plugin.send({
            message: {
              request: "join",
              room: state.streams[rid][type].room,
              ptype: "publisher",
              display: 'Auditor'
            }
          });
        },
        onmessage: function (msg, jsep) {
          // Handle msg, if needed, and check jsep
          const event = msg['videoroom']

          if (event) {
            if (event === 'joined') {
              commit('SET_AUDIT_STREAM_DATA', { rid, type, field: 'id', value: msg["id"] })
              Janus.log("Successfully joined room " + msg["room"])
              if(msg["publishers"]) {
                commit('SET_AUDIT_STREAM_DATA', { rid, type, field: 'publishers', value: msg["publishers"] })

                for (let f in state.streams[rid][type].publishers) {
                  const id = state.streams[rid][type].publishers[f]["id"]
                  const display = state.streams[rid][type].publishers[f]["display"]
                  Janus.debug("  >> [" + id + "] " + display)
                  dispatch('auditRemoteFeed', { id, rid, type })
                }
              }
            } else if (event) {
              if (msg["publishers"]) {
                commit('SET_AUDIT_STREAM_DATA', { rid, type, field: 'publishers', value: msg["publishers"] })
                Janus.debug("Got a list of available publishers/feeds:", state.streams[rid][type].publishers);

                for (let f in state.streams[rid][type].publishers) {
                  const id = state.streams[rid][type].publishers[f]["id"]
                  const display = state.streams[rid][type].publishers[f]["display"]
                  Janus.debug("  >> [" + id + "] " + display)
                  dispatch('auditRemoteFeed', { id, rid, type })
                }
              } else if (msg["leaving"]) {
                // One of the publishers has gone away?
                const leaving = msg["leaving"]
                Janus.log("Publisher left: " + leaving);
              } else if (msg["error"]) {
                console.log(msg["error"])
              }
            }
          }

          if (jsep !== undefined && jsep !== null) {
            // We have the ANSWER from the plugin
            state.streams[rid][type].plugin.handleRemoteJsep({ jsep });
          }
        },
        onremotestream: function (stream) {
          commit('SET_AUDIT_STREAM_DATA', { rid, type, field: 'media', value: stream })
        },
      })
    },
    startScreen({ state }) {
      state.plugins.screen.send({
        message: {
          request: "join",
          room: state.roomScreen,
          ptype: "publisher",
          display: 'Auditor'
        }
      });
    },
    newRemoteFeed({ commit, state }, { id, display }) {
      state.janus.attach(
        {
          plugin: "janus.plugin.videoroom",
          success: (pluginHandle) => {
            commit('SET_PLUGIN', { type: 'videoroom', plugin: pluginHandle })

            Janus.log("Plugin attached! (" + state.plugins.videoroom.getPlugin() + ", id=" + state.plugins.videoroom.getId() + ")");
            Janus.log("  -- This is a subscriber");
            // We wait for the plugin to send us an offer
            state.plugins.videoroom.send({ message: {
              request: "join",
              room: state.room,
              ptype: "listener",
              feed: id
            } });
          },
          error: function (error) {
            Janus.error("  -- Error attaching plugin...", error);
          },
          onmessage: function (msg, jsep) {
            Janus.debug(" ::: Got a message (listener) :::", msg)
            const event = msg["videoroom"]

            Janus.debug("Event: " + event)

            if (event) {
              if (event === "attached") {
                Janus.log("Successfully attached to feedin room " + msg["room"])
              } else {
                // What has just happened?
              }
            }
            if (jsep) {
              Janus.debug("Handling SDP as well...", jsep);
              // Answer and attach
              state.plugins.videoroom.createAnswer(
                {
                  jsep,
                  media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
                  success: function (jsep) {
                    Janus.debug("Got SDP!", jsep);
                    state.plugins.videoroom.send({ message: { request: "start", room: state.room }, jsep });
                  },
                  error: function (error) {
                    Janus.error("WebRTC error:", error);
                    bootbox.alert("WebRTC error... " + error.message);
                  }
                })
            }
          },
          onlocalstream: function (stream) {
            // The subscriber stream is recvonly, we don't expect anything here
          },
          onremotestream: function (stream) {
            commit('SET_STREAM', stream)
          },
          oncleanup: function () {
            console.log('onCleanup')
          }
        });
        state.janus.attach(
          {
            plugin: "janus.plugin.videoroom",
            success: (pluginHandle) => {
              commit('SET_PLUGIN', { type: 'videoroom2', plugin: pluginHandle })

              Janus.log("Plugin attached! (" + state.plugins.videoroom2.getPlugin() + ", id=" + state.plugins.videoroom2.getId() + ")");
              Janus.log("  -- This is a subscriber");
              // We wait for the plugin to send us an offer
              state.plugins.videoroom2.send({ message: {
                request: "join",
                room: state.roomScreen,
                ptype: "listener",
                feed: id
              } });
            },
            error: function (error) {
              Janus.error("  -- Error attaching plugin...", error);
            },
            onmessage: function (msg, jsep) {
              Janus.debug(" ::: Got a message (listener) :::", msg)
              const event = msg["videoroom"]

              Janus.debug("Event: " + event)

              if (event) {
                if (event === "attached") {
                  Janus.log("Successfully attached to feedin room " + msg["room"])
                } else {
                  // What has just happened?
                }
              }
              if (jsep) {
                Janus.debug("Handling SDP as well...", jsep);
                // Answer and attach
                state.plugins.videoroom2.createAnswer(
                  {
                    jsep,
                    media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
                    success: function (jsep) {
                      Janus.debug("Got SDP!", jsep);
                      state.plugins.videoroom2.send({ message: { request: "start", room: state.roomScreen }, jsep });
                    },
                    error: function (error) {
                      Janus.error("WebRTC error:", error);
                      bootbox.alert("WebRTC error... " + error.message);
                    }
                  })
              }
            },
            onlocalstream: function (stream) {
              // The subscriber stream is recvonly, we don't expect anything here
            },
            onremotestream: function (stream) {
              commit('SET_SCREEN_STREAM', stream)
            },
            oncleanup: function () {
              console.log('onCleanup')
            }
          });
    },
    auditRemoteFeed({ state, commit }, { id, rid, type }) {
      state.janus.attach({
        plugin: "janus.plugin.videoroom",
        success: (pluginHandle) => {
          commit('SET_AUDIT_STREAM_DATA', { rid, type, field: 'vPlugin', value: pluginHandle })
          Janus.log("  -- This is a subscriber");
          // We wait for the plugin to send us an offer
          state.streams[rid][type].vPlugin.send({ message: {
            request: "join",
            room: state.streams[rid][type].room,
            ptype: "listener",
            feed: id
          } });
        },
        error: function (error) {
          Janus.error("  -- Error attaching plugin...", error);
        },
        onmessage: function (msg, jsep) {
          Janus.debug(" ::: Got a message (listener) :::", msg)
          const event = msg["videoroom"]

          Janus.debug("Event: " + event)

          if (event) {
            if (event === "attached") {
              Janus.log("Successfully attached to feedin room " + msg["room"])
            } else {
              // What has just happened?
            }
          }
          if (jsep) {
            Janus.debug("Handling SDP as well...", jsep);
            // Answer and attach
            state.streams[rid][type].vPlugin.createAnswer(
              {
                jsep,
                media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
                success: function (jsep) {
                  Janus.debug("Got SDP!", jsep);
                  state.streams[rid][type].vPlugin.send({ message: { request: "start", room: state.streams[rid][type].room }, jsep });
                },
                error: function (error) {
                  Janus.error("WebRTC error:", error);
                }
              })
          }
        },
        onlocalstream: function (stream) {
          // The subscriber stream is recvonly, we don't expect anything here
        },
        onremotestream: function (stream) {
          const streams = {...state.streams}

          commit('REACTIVITY_STREAM', streams)
          commit('SET_AUDIT_STREAM_DATA', { rid, type, field: 'media', value: stream })
        },
        oncleanup: function () {
          console.log('onCleanup')
        }
      });
    },
    initAudit({ dispatch, commit }) {
      return new Promise((resolve, reject) => {
        Janus.init({
          debug: true,
          dependencies: Janus.useDefaultDependencies(),
          callback: async () => {
            await dispatch('connectAudit', { server })
            resolve()
          }
        })
      })
    },
    connectAudit({ commit }, { server }) {
      return new Promise((resolve, reject) => {
        const janus = new Janus({
          server,
          success: () => {
            commit('SET_JANUS', janus)
            resolve()
          },
          error: (error) => {
            console.log(error)
            reject()
          },
          destroyed: () => {
            // window.location.reload()
          }
        })
      })

    },
    resetStreams({ commit }) {
      commit('RESET_STREAMS')
    },
    loadRecords({ dispatch }, {agentExamId, examType }) {
      dispatch('setRecordPlugin', { type: 'camera', agentExamId, examType })
      dispatch('setRecordPlugin', { type: 'screen', agentExamId, examType })
    },
    setRecordPlugin({ state, commit }, { type, agentExamId, examType }) {
      state.janus.attach({
        plugin: "janus.plugin.recordplay",
        success: (pluginHandle) => {
          commit('SET_RECORD_PLUGIN', { type, plugin: pluginHandle })
          Janus.log("  -- This is a subscriber");
          // We wait for the plugin to send us an offer
          state.records[type].plugin.send({ message: { request: "update" }})
          state.records[type].plugin.send({ message: { request: "list" }, success: (result) => {
            if(result["list"]) {
              const list = result["list"]
                .filter((mp) => {
                return mp.name.match(`<${agentExamId}_${examType === 'test' ? 't' : 'e'}_${type === 'camera' ? 'k' : 's'}>`)
              })
              commit('SET_RECORD_LIST', {type, list })
            }
          } })
        },
        error: function (error) {
          Janus.error("  -- Error attaching plugin...", error);
        },
        onmessage: function (msg, jsep) {
          const result = msg["result"]
          if(result) {
            if(result["status"]) {
              const event = result["status"]

              if(event === 'preparing' || event === 'refreshing') {
                Janus.log("Preparing the recording playout");
                state.records[type].plugin.createAnswer(
                  {
                    jsep: jsep,
                    media: { audioSend: false, videoSend: false, data: true },	// We want recvonly audio/video
                    success: function(jsep) {
                      Janus.debug("Got SDP!", jsep);
                      state.records[type].plugin.send({ message: { request: "start" }, jsep })
                    }
                  });
              } else if(event === 'playing') {
                Janus.log("Playout has started!")
              }
            }
          }
          if (jsep) {
            Janus.debug("Handling SDP as well...", jsep);
            // state.records[type].plugin.handleRemoteJsep({ jsep });
          }
        },
        onlocalstream: function (stream) {
          // The subscriber stream is recvonly, we don't expect anything here
        },
        onremotestream: function (stream) {
          commit('SET_RECORD_STREAM', {type, stream })
        },
        oncleanup: function () {
          console.log('onCleanup')
        }
      });
    },
    playRecord({ state }, position) {
      if(state.records.camera.list[position]) {
        state.records.camera.plugin.send({ message: { request: 'play', id: state.records.camera.list[position].id } })
      }

      if(state.records.screen.list[position]) {
        state.records.screen.plugin.send({ message: { request: 'play', id: state.records.screen.list[position].id } })
      }
    },
    stopRecord({ state }) {
      state.records.camera.plugin.send({ message: { request: 'stop' } })
      state.records.screen.plugin.send({ message: { request: 'stop' } })
    }
  },
}
