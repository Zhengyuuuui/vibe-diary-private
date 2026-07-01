import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Bookshelf',
    component: () => import('@/views/BookshelfView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/archive',
    redirect: '/reflection'
  },
  {
    path: '/reflection',
    name: 'Reflection',
    component: () => import('@/views/ReflectionView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ArchiveSection',
        component: () => import('@/views/ArchiveSection.vue'),
        meta: { requiresAuth: true, page: 1 }
      },
      {
        path: 'garden',
        name: 'GardenSection',
        component: () => import('@/views/GardenSection.vue'),
        meta: { requiresAuth: true, page: 2 }
      },
      {
        path: 'letters',
        name: 'LetterSection',
        component: () => import('@/views/LetterSection.vue'),
        meta: { requiresAuth: true, page: 2 }
      }
    ]
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/FavoritesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/diary/:id',
    name: 'DiaryReader',
    component: () => import('@/views/DiaryReaderView.vue'),
    props: true,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
