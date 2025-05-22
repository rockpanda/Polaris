import { createRouter, createWebHistory } from 'vue-router'
import MapView from '../views/MapView.vue'
import Evangelists from '../views/Evangelists.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'map',
      component: MapView
    },
    {
      path: '/evangelists',
      name: 'evangelists',
      component: Evangelists
    }
  ]
})

export default router 