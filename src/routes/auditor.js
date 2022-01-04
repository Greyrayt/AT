export default [
  {
    path: '/auditor/login',
    name: 'auditor-login',
    component: () => import(/* webpackChunkName: "auditor-login-page" */ '../views/pages/auth/AuditorLoginPage'),
    meta: {
      title: 'Вход',
    }
  },
  {
    path: '/auditor',
    name: 'auditor-home',
    component: () => import(/* webpackChunkName: "auditor-layout" */ '../views/layouts/AuditorLayout'),
    meta: {
      title: 'Главная',
      requiredAuditorAuth: true,
    },
    redirect: { name: 'auditor-exams-list' },
    children: [
      {
        path: 'exams-list',
        name: 'auditor-exams-list',
        component: () => import(/* webpackChunkName: "auditor-exams-list-page" */ '../views/pages/auditor/ExamsListPage'),
        meta: {
          title: 'Список экзаменов',
          requiredAuditorAuth: true,
        },
        redirect: { name: 'auditor-current-exams' },
        children: [
          {
            path: 'current-exams',
            name: 'auditor-current-exams',
            component: () => import(/* webpackChunkName: "auditor-current-exams-page" */ '../views/pages/auditor/CurrentExamPage'),
            meta: {
              title: 'Текущие экзамены',
              requiredAuditorAuth: true,
            },
          },
          {
            path: 'completed-exams',
            name: 'auditor-completed-exams',
            component: () => import(/* webpackChunkName: "auditor-completed-exams-page" */ '../views/pages/auditor/CompletedExamPage'),
            meta: {
              title: 'Текущие экзамены',
              requiredAuditorAuth: true,
            },
          },
        ]
      },
      {
        path: 'audit',
        name: 'auditor-audit',
        component: () => import(/* webpackChunkName: "auditor-audit-page" */ '../views/pages/auditor/AuditPage'),
        meta: {
          title: 'Аудирование',
        }
      },
      {
        path: 'audit/:agentExamId',
        name: 'auditor-audit-exam',
        component: () => import(/* webpackChunkName: "auditor-audit-exam-page" */ '../views/pages/auditor/AuditExamPage'),
        meta: {
          title: 'Аудирование Экзамена',
        }
      },
      {
        path: 'watch/:rid',
        name: 'auditor-watch-exam',
        component: () => import(/* webpackChunkName: "auditor-watch-exam-page" */ '../views/pages/auditor/WatchExamPage'),
        meta: {
          title: 'Просмотр Экзамена',
        }
      },
    ]
  },
]
