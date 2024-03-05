import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
    {
        meta: {
            title: 'Home',
            titlePT: 'Início',
        },
        path: '/',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
    },
    {
        meta: {
            title: 'Login',
            titlePT: 'Entrar',
        },
        path: '/login',
        name: 'login',
        component: () => import('../views/LoginView.vue'),
    },
    {
        meta: {
            title: 'Register',
            titlePT: 'Registar',
        },
        path: '/register',
        name: 'register',
        component: () => import('../views/RegisterView.vue'),
    },
    {
        meta: {
            title: 'Profile',
            titlePT: 'Perfil',
            requiresAuth: true,
        },
        path: '/profile',
        name: 'profile',
        component: () => import('../views/ProfileView.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return savedPosition || { top: 0 };
    },
});

export default router;
