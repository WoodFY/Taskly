<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useAuthStore } from '@/stores/auth'
  import { useRouter } from 'vue-router'

  const { t, locale } = useI18n()
  const authStore = useAuthStore()
  const router = useRouter()

  function toggleLocale() {
    const next = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
    locale.value = next
    localStorage.setItem('locale', next)
  }

  async function handleLogout() {
    await authStore.doLogout()
    router.push('/login')
  }
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__brand">Taskly</div>
      <nav class="app-header__nav">
        <button
          class="btn btn-secondary btn-sm"
          @click="toggleLocale"
        >
          {{ locale === 'zh-CN' ? 'EN' : '中文' }}
        </button>
        <button
          class="btn btn-secondary btn-sm"
          @click="handleLogout"
        >
          {{ t('nav.logout') }}
        </button>
      </nav>
    </div>
  </header>
</template>

<style lang="less" scoped>
  @import '@/styles/variables.less';

  .app-header {
    background-color: #fff;
    border-bottom: 1px solid @border-color;
    position: sticky;
    top: 0;
    z-index: 100;

    &__inner {
      max-width: 960px;
      margin: 0 auto;
      padding: 0 16px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &__brand {
      font-size: 18px;
      font-weight: 700;
      color: @primary-color;
      letter-spacing: -0.5px;
    }

    &__nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
</style>
