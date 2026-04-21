import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import NodeDelegate from "./NodeDelegate.vue";
import { i18n } from "@/lib/i18n";
import { Registry } from "@/lib/nodes/registry";
import { Plus } from "lucide-vue-next";
import { INodeType } from "@/lib/types";

// Mock @vue-flow/core
vi.mock("@vue-flow/core", () => ({
  Handle: {
    template: '<div class="vue-flow__handle"><slot /></div>',
    props: ["id", "type", "position"],
  },
  Position: {
    Left: "left",
    Right: "right",
    Top: "top",
    Bottom: "bottom",
  },
  useVueFlow: () => ({
    removeNodes: vi.fn(),
    getEdges: { value: [] },
    project: (p: { x: number; y: number }) => p,
    findNode: vi.fn(),
  }),
}));

describe("NodeDelegate Component", () => {
  const testNode: INodeType = {
    description: {
      name: "testNode",
      displayName: "Test Node",
      icon: "test",
      group: ["test"],
      version: 1,
      description: "test",
      defaults: { name: "testNode" },
      inputs: [{ name: "in", type: "main" }],
      outputs: [{ name: "out", type: "main" }],
      properties: [],
    },
    execute: async () => [],
  };

  beforeEach(() => {
    Registry.register(testNode);
  });

  it("should render plus button and confirm it's inside a Handle", () => {
    const wrapper = mount(NodeDelegate, {
      props: {
        id: "node-1",
        data: {
          nodeType: "testNode",
          label: "My Test Node",
        },
      },
      global: {
        plugins: [i18n],
        provide: {
          openQuickAdd: vi.fn(),
        },
        stubs: {
            NodeIcon: true
        }
      },
    });

    // Find the plus button
    const plusButton = wrapper.findComponent(Plus);
    expect(plusButton.exists()).toBe(true);

    // Get the parent of the button
    const button = plusButton.element.closest("button");
    expect(button).not.toBeNull();

    // Find all Handle components (vue-flow__handle class in our mock)
    const handles = wrapper.findAll(".vue-flow__handle");
    
    // For each handle, check if it contains the plus button
    const plusInsideHandle = handles.some(handle => handle.element.contains(plusButton.element));
    
    expect(plusInsideHandle).toBe(true);
  });

  it("should render plus button inside a Handle for bottom inputs", () => {
    const toolNode: INodeType = {
      description: {
        name: "toolNode",
        displayName: "Tool Node",
        icon: "tool",
        group: ["test"],
        version: 1,
        description: "test",
        defaults: { name: "toolNode" },
        inputs: [{ name: "tool-in", type: "tool" }],
        outputs: [],
        properties: [],
      },
      execute: async () => [],
    };
    Registry.register(toolNode);

    const wrapper = mount(NodeDelegate, {
      props: {
        id: "node-2",
        data: {
          nodeType: "toolNode",
          label: "Tool Node",
        },
      },
      global: {
        plugins: [i18n],
        provide: {
          openQuickAdd: vi.fn(),
        },
        stubs: {
          NodeIcon: true,
        },
      },
    });

    // Find the plus button
    const plusButton = wrapper.findComponent(Plus);
    expect(plusButton.exists()).toBe(true);

    // Find all Handle components
    const handles = wrapper.findAll(".vue-flow__handle");

    // Check if the plus button is inside one of the handles
    const plusInsideHandle = handles.some((handle) =>
      handle.element.contains(plusButton.element)
    );

    expect(plusInsideHandle).toBe(true);
  });

  it("should open quick add when clicking plus button", async () => {
    const openQuickAdd = vi.fn();
    const wrapper = mount(NodeDelegate, {
      props: {
        id: "node-3",
        data: {
          nodeType: "testNode",
          label: "My Test Node",
        },
      },
      global: {
        plugins: [i18n],
        provide: {
          openQuickAdd,
        },
        stubs: {
          NodeIcon: true,
        },
      },
    });

    // Find the plus button
    const plusButton = wrapper.findComponent(Plus);
    const button = plusButton.element.closest("button");
    expect(button).not.toBeNull();

    // Click the button
    await (button as HTMLButtonElement).click();

    // Verify openQuickAdd was called with correct arguments
    // nodeId, handleId, handleType, position, screenPosition
    expect(openQuickAdd).toHaveBeenCalledWith(
      "node-3",
      "out",
      "source",
      expect.any(Object),
      expect.any(Object)
    );
  });
});
