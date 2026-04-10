import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CredentialIcon from './CredentialIcon.vue';
import { Key, User } from 'lucide-vue-next';

vi.mock('@/lib/credentials/icons', () => ({
  getCredentialIconContent: (icon: string) => {
    if (icon === 'file:test') return '<svg id="test-svg">test</svg>';
    return null;
  }
}));

describe('CredentialIcon Component', () => {
  it('should render default Key icon when no icon is provided', () => {
    const wrapper = mount(CredentialIcon);
    expect(wrapper.findComponent(Key).exists()).toBe(true);
  });

  it('should render Lucide icon when object icon is provided', () => {
    const wrapper = mount(CredentialIcon, {
      props: { icon: User }
    });
    expect(wrapper.findComponent(User).exists()).toBe(true);
  });

  it('should render SVG as data URL when file: icon is provided', () => {
    const wrapper = mount(CredentialIcon, {
      props: { icon: 'file:test' }
    });
    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toContain('data:image/svg+xml');
    expect(img.attributes('src')).toContain('id%3D%22test-svg%22');
    expect(img.attributes('src')).toContain('preserveAspectRatio%3D%22xMidYMid%20meet%22');
  });
});