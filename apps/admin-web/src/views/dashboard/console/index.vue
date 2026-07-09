<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as echarts from 'echarts';

/* ---------- 模拟统计数据 ---------- */
const stats = ref([
  { title: '用户总数', value: '12,846', prefix: '+12%', trend: 'up' as const, color: '#18a058' },
  { title: '今日订单', value: '884', prefix: '-3%', trend: 'down' as const, color: '#d03050' },
  { title: '访问量', value: '32,580', prefix: '+8%', trend: 'up' as const, color: '#18a058' },
  { title: '营收金额', value: '¥28,400', prefix: '+15%', trend: 'up' as const, color: '#18a058' },
]);

/* ---------- 模拟访问来源 ---------- */
const trafficSources = [
  { name: '直接访问', value: 335, percent: '33.5%', color: '#18a058' },
  { name: '搜索引擎', value: 310, percent: '31.0%', color: '#2080f0' },
  { name: '社交媒体', value: 234, percent: '23.4%', color: '#f0a020' },
  { name: '邮件营销', value: 121, percent: '12.1%', color: '#d03050' },
];

/* ---------- 模拟最新动态 ---------- */
const activities = [
  { user: '张三', action: '注册了新账号', time: '2 分钟前', type: 'info' as const },
  {
    user: '系统',
    action: '订单 #20240708 已完成支付',
    time: '15 分钟前',
    type: 'success' as const,
  },
  { user: '李四', action: '上传了 5 个文件', time: '1 小时前', type: 'warning' as const },
  { user: '王五', action: '修改了角色权限配置', time: '2 小时前', type: 'info' as const },
  { user: '系统', action: '数据库备份完成', time: '3 小时前', type: 'success' as const },
  { user: '赵六', action: '提交了退款申请', time: '5 小时前', type: 'error' as const },
];

/* ---------- ECharts 趋势图 ---------- */
const trendChartRef = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;

function initTrendChart() {
  if (!trendChartRef.value) return;
  trendChart = echarts.init(trendChartRef.value);
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 20, bottom: 24 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLine: { lineStyle: { color: '#e0e0e0' } },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f5f5f5' } } },
    series: [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        data: [820, 932, 901, 1290, 1330, 1320, 1120, 1250, 1480, 1560, 1720, 1890],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(32, 128, 240, 0.3)' },
            { offset: 1, color: 'rgba(32, 128, 240, 0.02)' },
          ]),
        },
        lineStyle: { color: '#2080f0', width: 2 },
        itemStyle: { color: '#2080f0' },
      },
    ],
  });
}

/* ---------- ECharts 来源饼图 ---------- */
const sourceChartRef = ref<HTMLElement | null>(null);
let sourceChart: echarts.ECharts | null = null;

function initSourceChart() {
  if (!sourceChartRef.value) return;
  sourceChart = echarts.init(sourceChartRef.value);
  sourceChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%' },
        labelLine: { show: true },
        data: [
          { name: '直接访问', value: 335, itemStyle: { color: '#18a058' } },
          { name: '搜索引擎', value: 310, itemStyle: { color: '#2080f0' } },
          { name: '社交媒体', value: 234, itemStyle: { color: '#f0a020' } },
          { name: '邮件营销', value: 121, itemStyle: { color: '#d03050' } },
        ],
      },
    ],
  });
}

/* ---------- Resize 响应式 ---------- */
const resizeObserver = new ResizeObserver(() => {
  trendChart?.resize();
  sourceChart?.resize();
});

onMounted(() => {
  initTrendChart();
  initSourceChart();
  if (trendChartRef.value) resizeObserver.observe(trendChartRef.value);
  if (sourceChartRef.value) resizeObserver.observe(sourceChartRef.value);
});

onUnmounted(() => {
  resizeObserver.disconnect();
  trendChart?.dispose();
  sourceChart?.dispose();
});
</script>

<template>
  <div>
    <h2 class="text-24px font-bold mb-20px">控制台</h2>

    <!-- 统计卡片 -->
    <n-grid :cols="4" :x-gap="16">
      <n-grid-item v-for="s in stats" :key="s.title">
        <n-card :bordered="true" size="small">
          <div class="text-14px text-#999 mb-4px">{{ s.title }}</div>
          <div class="flex items-baseline gap-8px">
            <span class="text-28px font-bold">{{ s.value }}</span>
            <span class="text-13px" :class="s.trend === 'up' ? 'text-#18a058' : 'text-#d03050'">
              {{ s.prefix }}
              <svg
                v-if="s.trend === 'up'"
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="inline-block align-middle"
              >
                <polygon points="12,4 20,18 4,18" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="inline-block align-middle"
              >
                <polygon points="12,20 4,6 20,6" />
              </svg>
            </span>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 趋势图 + 来源饼图 -->
    <n-grid :cols="3" :x-gap="16" class="mt-16px">
      <!-- 访问趋势 -->
      <n-grid-item :span="2">
        <n-card title="访问趋势" :bordered="true" size="small">
          <div ref="trendChartRef" class="h-320px" />
        </n-card>
      </n-grid-item>

      <!-- 访问来源 -->
      <n-grid-item :span="1">
        <n-card title="访问来源" :bordered="true" size="small">
          <div ref="sourceChartRef" class="h-320px" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 最新动态 -->
    <n-card title="最新动态" :bordered="true" size="small" class="mt-16px">
      <n-timeline>
        <n-timeline-item
          v-for="act in activities"
          :key="act.time"
          :type="act.type"
          :time="act.time"
        >
          <span class="font-medium">{{ act.user }}</span>
          {{ act.action }}
        </n-timeline-item>
      </n-timeline>
    </n-card>
  </div>
</template>
