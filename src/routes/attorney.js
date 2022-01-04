export default [
  {
    path: '/login',
    name: 'login',
    component: () => import(/* webpackChunkName: "login-page" */ '../views/pages/auth/LoginPage'),
    meta: {
      title: 'Вход',
    }
  },
  {
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "base-layout" */ '../views/layouts/BaseLayout'),
    meta: {
      title: 'Главная',
      requiredAuth: true,
    },
    redirect: { name: 'choose-exam' },
    children: [
      {
        path: 'prepare',
        name: 'prepare',
        component: () => import(/* webpackChunkName: "prepare-page" */ '../views/pages/PreprarePage'),
        meta: {
          title: 'Подготовка',
          requiredAuth: true,
        },
      },
      {
        path: '',
        name: 'choose-exam',
        component: () => import(/* webpackChunkName: "choose-exam-page" */ '../views/pages/ChooseExamPage'),
        meta: {
          title: 'Выбор экзамена',
          requiredAuth: true,
          requiredAccess: true
        },
      },
      {
        path: 'test',
        name: 'test',
        component: () => import(/* webpackChunkName: "test-page" */ '../views/pages/TestPage'),
        meta: {
          title: 'Тестирование',
          requiredAuth: true,
          requiredAccess: true
        },
      },
      {
        path: 'test-result',
        name: 'test-result',
        component: () => import(/* webpackChunkName: "test-result-page" */ '../views/pages/TestResultPage'),
        meta: {
          title: 'Результаты тестирования',
          requiredAuth: true,
        },
      },
      {
        path: 'exam',
        name: 'exam',
        component: () => import(/* webpackChunkName: "exam-page" */ '../views/pages/ExamPage'),
        meta: {
          title: 'Письменный экзамен',
          requiredAuth: true,
          requiredAccess: true
        },
      },
      {
        path: 'exam-result',
        name: 'exam-result',
        component: () => import(/* webpackChunkName: "exam-result-page" */ '../views/pages/ExamResultPage'),
        meta: {
          title: 'Результаты экзамена',
          requiredAuth: true,
        },
      },
    ],
  },
]
