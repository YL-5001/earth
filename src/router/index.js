import { createRouter, createWebHistory } from 'vue-router'
import ReportView from '../views/ReportView.vue'

const routes = [
  {
    path: '/',
    name: 'reportView',
    component: ReportView
  },
  // {
  //   path: '/about',
  //   name: 'about',
  //   component: () => import('../views/AboutView.vue')
  // }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
