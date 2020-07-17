import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/spotify-auth-callback',
    name: 'callback',
    props: getHashParams,
    component: () => import(/* webpackChunkName: "callback" */ '../views/Callback.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

function getHashParams () {
  const hashParams = {}
  const r = /([^&;=]+)=?([^&;]*)/g
  const q = window.location.hash.substring(1)
  var e = r.exec(q)

  while (e) {
    hashParams[e[1]] = decodeURIComponent(e[2])
    e = r.exec(q)
  }
  return hashParams
}

export default router
