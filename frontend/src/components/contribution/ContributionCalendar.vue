<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { taskApi } from '@/api/task'

  const { locale } = useI18n()

  const props = defineProps<{
    selectedDate?: string | null
  }>()

  const emit = defineEmits<{
    selectDate: [date: string]
  }>()

  const contributions = ref<Record<string, number>>({})

  onMounted(async () => {
    try {
      contributions.value = await taskApi.getContribution()
    } catch {
      // ignore
    }
  })

  function formatLocalDate(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 生成最近 52 周的日历网格（以周日为起始列）
  const weeks = computed(() => {
    const today = new Date()
    const todayStr = formatLocalDate(today)

    // 找到 52 周前的周日
    const start = new Date(today)
    start.setDate(start.getDate() - 52 * 7 - start.getDay())

    const result: Array<Array<{ date: string; count: number; isToday: boolean; isFuture: boolean }>> = []
    const cur = new Date(start)

    for (let w = 0; w < 53; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const dateStr = formatLocalDate(cur)
        week.push({
          date: dateStr,
          count: contributions.value[dateStr] ?? 0,
          isToday: dateStr === todayStr,
          isFuture: cur > today
        })
        cur.setDate(cur.getDate() + 1)
      }
      result.push(week)
    }
    return result
  })

  // 每列（周）对应的月份标签，只在月份切换时显示
  const monthLabels = computed(() => {
    return weeks.value.map((week, i) => {
      const firstDay = new Date(week[0].date)
      const prevWeek = weeks.value[i - 1]
      if (!prevWeek) return firstDay.toLocaleString(locale.value, { month: 'short' })
      const prevMonth = new Date(prevWeek[0].date).getMonth()
      if (firstDay.getMonth() !== prevMonth) {
        return firstDay.toLocaleString(locale.value, { month: 'short' })
      }
      return ''
    })
  })

  // 颜色等级 0~4
  function getLevel(count: number, isFuture: boolean): number {
    if (isFuture) return -1
    if (count === 0) return 0
    if (count === 1) return 1
    if (count <= 3) return 2
    if (count <= 6) return 3
    return 4
  }

  function handleCellClick(day: { date: string; count: number; isFuture: boolean }) {
    if (day.count === 0 || day.isFuture) return
    emit('selectDate', day.date)
  }

  const dayLabels = computed(() => {
    const days = locale.value === 'zh-CN' ? ['日', '一', '二', '三', '四', '五', '六'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    return [days[1], days[3], days[5]] // 只显示 Mon / Wed / Fri
  })
</script>

<template>
  <div class="contribution card">
    <div class="contribution__header">
      <span class="contribution__title">{{ locale === 'zh-CN' ? '任务记录' : 'Task Activity' }}</span>
      <div class="contribution__legend">
        <span class="legend-label">{{ locale === 'zh-CN' ? '少' : 'Less' }}</span>
        <span
          v-for="l in [0, 1, 2, 3, 4]"
          :key="l"
          :class="['legend-cell', `level-${l}`]"
        />
        <span class="legend-label">{{ locale === 'zh-CN' ? '多' : 'More' }}</span>
      </div>
    </div>

    <div class="contribution__body">
      <!-- 星期标签 -->
      <div class="day-labels">
        <span />
        <span
          v-for="(label, i) in [0, 1, 2, 3, 4, 5, 6]"
          :key="i"
          class="day-label"
        >
          {{ i === 1 || i === 3 || i === 5 ? dayLabels[Math.floor(i / 2)] : '' }}
        </span>
      </div>

      <!-- 日历格子 -->
      <div class="grid-wrap">
        <!-- 月份标签行 -->
        <div class="month-row">
          <span
            v-for="(label, i) in monthLabels"
            :key="i"
            class="month-label"
          >{{ label }}</span>
        </div>

        <!-- 格子区域 -->
        <div class="grid">
          <div
            v-for="(week, wi) in weeks"
            :key="wi"
            class="grid__col"
          >
            <div
              v-for="(day, di) in week"
              :key="di"
              :class="[
                'cell',
                `level-${getLevel(day.count, day.isFuture)}`,
                {
                  'is-today': day.isToday,
                  'is-selected': day.date === props.selectedDate,
                  'is-clickable': day.count > 0 && !day.isFuture
                }
              ]"
              :title="`${day.date}${day.count > 0 ? `  ·  ${day.count} tasks` : ''}`"
              @click="handleCellClick(day)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
  @import '@/styles/variables.less';

  @cell-size: 12px;
  @cell-gap: 4px;

  .contribution {
    padding: 16px;
    margin-top: 2px;
    overflow: hidden;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    &__title {
      font-size: 13px;
      font-weight: 600;
      color: @text-secondary;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    &__legend {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    &__body {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
  }

  .legend-label {
    font-size: 11px;
    color: @text-secondary;
  }

  .legend-cell {
    width: @cell-size;
    height: @cell-size;
    border-radius: 2px;
  }

  .day-labels {
    display: flex;
    flex-direction: column;
    gap: @cell-gap;
    padding-top: 20px; // 对齐月份行

    .day-label {
      height: @cell-size;
      font-size: 9px;
      color: @text-secondary;
      line-height: @cell-size;
      text-align: right;
      white-space: nowrap;
      width: 14px;
    }
  }

  .grid-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .month-row {
    display: flex;
    gap: @cell-gap;
    height: 16px;
  }

  .month-label {
    width: @cell-size;
    font-size: 10px;
    color: @text-secondary;
    white-space: nowrap;
    overflow: visible;
  }

  .grid {
    display: flex;
    gap: @cell-gap;

    &__col {
      display: flex;
      flex-direction: column;
      gap: @cell-gap;
    }
  }

  // 格子颜色
  .cell {
    width: @cell-size;
    height: @cell-size;
    border-radius: 2px;
    cursor: default;
    transition: opacity 0.15s;

    &:hover {
      opacity: 0.75;
    }

    &.is-today {
      outline: 2px solid @primary-color;
      outline-offset: 1px;
    }
  }

  .level--1 { background-color: transparent; } // 未来日期
  .level-0  { background-color: #ebedf0; }
  .level-1  { background-color: #9be9a8; }
  .level-2  { background-color: #40c463; }
  .level-3  { background-color: #30a14e; }
  .level-4  { background-color: #216e39; }

  .is-clickable { cursor: pointer; }

  .is-selected {
    outline: 2px solid #fff;
    outline-offset: 1px;
  }
</style>
