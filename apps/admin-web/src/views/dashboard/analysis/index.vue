<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as echarts from 'echarts';

/* ---------- 模拟数据 ---------- */
const months = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];
const revenueData = [28, 35, 32, 48, 52, 58, 55, 62, 70, 78, 85, 92];
const orderData = [120, 180, 150, 230, 280, 310, 290, 340, 380, 420, 470, 520];
const growthRate = [12, 8, 15, 20, 18, 22, 16, 25, 28, 30, 24, 32];

/* ---------- 品类分布 ---------- */
const categoryData = [
  { name: '电子产品', value: 35, color: '#2080f0' },
  { name: '服装鞋帽', value: 25, color: '#18a058' },
  { name: '食品饮料', value: 18, color: '#f0a020' },
  { name: '家居用品', value: 12, color: '#7c3aed' },
  { name: '其他', value: 10, color: '#d03050' },
];

/* ---------- 转化漏斗 ---------- */
const funnelData = [
  { name: '访问量', value: 10000 },
  { name: '注册用户', value: 5200 },
  { name: '首次下单', value: 2800 },
  { name: '完成支付', value: 1800 },
  { name: '复购用户', value: 960 },
];

/* ========== 图表 1: 营收 + 订单组合图 ========== */
const comboChartRef = ref<HTMLElement | null>(null);
let comboChart: echarts.ECharts | null = null;

function initComboChart() {
  if (!comboChartRef.value) return;
  comboChart = echarts.init(comboChartRef.value);
  comboChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['营收 (万元)', '订单数'],
      bottom: 0,
    },
    grid: { left: 48, right: 48, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#e0e0e0' } },
    },
    yAxis: [
      { type: 'value', name: '营收 (万元)', splitLine: { lineStyle: { color: '#f5f5f5' } } },
      { type: 'value', name: '订单数', splitLine: { show: false } },
    ],
    series: [
      {
        name: '营收 (万元)',
        type: 'bar',
        data: revenueData,
        itemStyle: { color: '#2080f0', borderRadius: [4, 4, 0, 0] },
        barWidth: 20,
      },
      {
        name: '订单数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: orderData,
        lineStyle: { color: '#18a058', width: 2 },
        itemStyle: { color: '#18a058' },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  });
}

/* ========== 图表 2: 品类分布饼图 ========== */
const categoryChartRef = ref<HTMLElement | null>(null);
let categoryChart: echarts.ECharts | null = null;

function initCategoryChart() {
  if (!categoryChartRef.value) return;
  categoryChart = echarts.init(categoryChartRef.value);
  categoryChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['30%', '60%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{d}%' },
        data: categoryData.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color },
        })),
      },
    ],
  });
}

/* ========== 图表 3: 转化漏斗 ========== */
const funnelChartRef = ref<HTMLElement | null>(null);
let funnelChart: echarts.ECharts | null = null;

function initFunnelChart() {
  if (!funnelChartRef.value) return;
  funnelChart = echarts.init(funnelChartRef.value);
  funnelChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [
      {
        type: 'funnel',
        left: 40,
        right: 40,
        top: 20,
        bottom: 20,
        minSize: 20,
        maxSize: 100,
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}: {c}',
          color: '#fff',
          fontWeight: 'bold',
        },
        labelLine: { show: false },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        emphasis: {
          label: { fontSize: 16 },
        },
        data: [
          { name: '访问量', value: 10000, itemStyle: { color: '#2080f0' } },
          { name: '注册用户', value: 5200, itemStyle: { color: '#18a058' } },
          { name: '首次下单', value: 2800, itemStyle: { color: '#f0a020' } },
          { name: '完成支付', value: 1800, itemStyle: { color: '#7c3aed' } },
          { name: '复购用户', value: 960, itemStyle: { color: '#d03050' } },
        ],
      },
    ],
  });
}

/* ========== 图表 4: 增长率折线图 ========== */
const growthChartRef = ref<HTMLElement | null>(null);
let growthChart: echarts.ECharts | null = null;

function initGrowthChart() {
  if (!growthChartRef.value) return;
  growthChart = echarts.init(growthChartRef.value);
  growthChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 16, top: 20, bottom: 28 },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#e0e0e0' } },
    },
    yAxis: {
      type: 'value',
      name: '增长率 (%)',
      splitLine: { lineStyle: { color: '#f5f5f5' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: growthRate,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 160, 88, 0.3)' },
            { offset: 1, color: 'rgba(24, 160, 88, 0.02)' },
          ]),
        },
        lineStyle: { color: '#18a058', width: 2 },
        itemStyle: { color: '#18a058' },
        symbol: 'diamond',
        symbolSize: 8,
      },
    ],
  });
}

/* ---------- 响应式 ---------- */
const resizeObserver = new ResizeObserver(() => {
  comboChart?.resize();
  categoryChart?.resize();
  funnelChart?.resize();
  growthChart?.resize();
});

onMounted(() => {
  initComboChart();
  initCategoryChart();
  initFunnelChart();
  initGrowthChart();
  [comboChartRef, categoryChartRef, funnelChartRef, growthChartRef].forEach((ref) => {
    if (ref.value) resizeObserver.observe(ref.value);
  });
});

onUnmounted(() => {
  resizeObserver.disconnect();
  comboChart?.dispose();
  categoryChart?.dispose();
  funnelChart?.dispose();
  growthChart?.dispose();
});
</script>

<template>
  <div>
    <h2 class="text-24px font-bold mb-20px">分析页</h2>

    <!-- 营收 + 订单组合图 -->
    <n-card title="营收趋势与订单量" :bordered="true" size="small">
      <div ref="comboChartRef" class="h-360px" />
    </n-card>

    <!-- 第二行：品类分布 + 转化漏斗 + 增长率 -->
    <n-grid :cols="3" :x-gap="16" class="mt-16px">
      <n-grid-item :span="1">
        <n-card title="品类分布" :bordered="true" size="small">
          <div ref="categoryChartRef" class="h-300px" />
        </n-card>
      </n-grid-item>

      <n-grid-item :span="1">
        <n-card title="转化漏斗" :bordered="true" size="small">
          <div ref="funnelChartRef" class="h-300px" />
        </n-card>
      </n-grid-item>

      <n-grid-item :span="1">
        <n-card title="增长率趋势" :bordered="true" size="small">
          <div ref="growthChartRef" class="h-300px" />
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>
