<template>
  <div class="app-root">
    <router-view />
    <div class="noise-overlay" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
// 应用根组件,所有路由从这里出口
</script>

<style lang="scss" scoped>
.app-root {
  width: 100%;
  height: 100%;
}
</style>
