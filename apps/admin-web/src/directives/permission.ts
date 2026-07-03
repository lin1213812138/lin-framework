import type { App } from 'vue';

function checkPermission(el: HTMLElement, binding: DirectiveBinding) {
  const permissions = localStorage.getItem('permissions')?.split(',') || [];
  const value = binding.value as string;
  if (value && !permissions.includes(value)) {
    el.style.display = 'none';
  } else {
    el.style.display = '';
  }
}

export function setupPermissionDirective(app: App) {
  app.directive('permission', {
    mounted(el, binding) {
      checkPermission(el, binding);
    },
    updated(el, binding) {
      checkPermission(el, binding);
    },
  });
}
