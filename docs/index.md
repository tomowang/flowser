---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Flowser"
  text: "A browser extension for automating web workflows with AI"
  tagline: "Build AI agents that can use any website as their API."
  image:
    src: /logo.svg
    alt: Flowser
  actions:
    - theme: brand
      text: Get Started
      link: /nodes/
    - theme: alt
      text: View on GitHub
      link: https://github.com/tomowang/flowser

features:
  - title: Visual Workflow Editor
    details: Build complex automations visually with a drag-and-drop node interface powered by Vue Flow.
    icon: 🎨
  - title: AI-Powered Agents
    details: Integrate state-of-the-art LLMs (OpenAI, Anthropic, Gemini, DeepSeek) directly into your workflows for intelligent data processing and decision making.
    icon: 🤖
  - title: Comprehensive Browser Automation
    details: Automate clicks, form fills, data extraction, and tab/window management across any website.
    icon: 🌐
  - title: Local-First & Private
    details: Your workflows and credentials stay in your browser. No data leaves your machine unless you want it to.
    icon: 🔒
  - title: Workflow Scheduling
    details: Run automations manually or schedule them using flexible cron-like triggers.
    icon: 📅
  - title: Custom Scripting
    details: Extend functionality with custom JavaScript nodes running in a secure sandbox (QuickJS).
    icon: 📜
  - title: Data Management
    details: Use built-in data tables to store, manage, and process data collected from your automations.
    icon: 📊
---
