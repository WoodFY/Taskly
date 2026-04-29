<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { authApi } from '@/api/auth'

  const { t } = useI18n()
  const router = useRouter()
  const authStore = useAuthStore()

  const isLoading = ref(false)
  const errorMsg = ref('')
  const form = reactive({ email: '', password: '' })

  async function handleSubmit() {
    errorMsg.value = ''
    isLoading.value = true
    try {
      const res = await authApi.register(form)
      authStore.setTokens(res.accessToken, res.refreshToken)
      router.push('/tasks')
    } catch (err: any) {
      errorMsg.value = err?.message ?? t('common.error')
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h1 class="auth-card__title">{{ t('auth.register') }}</h1>

      <form @submit.prevent="handleSubmit">
        <div class="form-item">
          <label>{{ t('auth.email') }}</label>
          <input
            v-model="form.email"
            type="email"
            class="input"
            :placeholder="t('auth.emailPlaceholder')"
            required
          />
        </div>

        <div class="form-item">
          <label>{{ t('auth.password') }}</label>
          <input
            v-model="form.password"
            type="password"
            class="input"
            :placeholder="t('auth.passwordPlaceholder')"
            minlength="6"
            required
          />
        </div>

        <p
          v-if="errorMsg"
          class="error-msg"
        >
          {{ errorMsg }}
        </p>

        <button
          type="submit"
          class="btn btn-primary submit-btn"
          :disabled="isLoading"
        >
          {{ isLoading ? t('common.loading') : t('auth.registerBtn') }}
        </button>
      </form>

      <p class="auth-card__switch">
        <RouterLink to="/login">{{ t('auth.switchToLogin') }}</RouterLink>
      </p>
    </div>
  </div>
</template>

<style lang="less" scoped>
  @import '@/styles/variables.less';

  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .auth-card {
    width: 100%;
    max-width: 400px;
    padding: 32px;

    &__title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 24px;
      text-align: center;
    }

    &__switch {
      margin-top: 16px;
      text-align: center;
      font-size: 13px;
      color: @text-secondary;
    }
  }

  .submit-btn {
    width: 100%;
    margin-top: 8px;
    padding: 10px;
  }

  .error-msg {
    color: @error-color;
    font-size: 13px;
    margin-bottom: 8px;
  }
</style>
