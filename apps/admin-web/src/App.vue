<script setup lang="ts">
import { zhCN } from 'naive-ui';
</script>

<template>
  <n-config-provider :locale="zhCN">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-dialog-provider>
          <router-view />
        </n-dialog-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
