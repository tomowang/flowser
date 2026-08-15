# Changelog

## [v2.0.0] - 2026-08-15


### Bug Fixes

- Import missing Inter 700 weight (Tomo Wang)

- Force body font via !important to resist injected styles (Tomo Wang)

- Vertically align icon-button text labels (Tomo Wang)


### Documentation

- Add scripting and webRequest permission justifications (Tomo Wang)

- Add DESIGN.md (Tomo Wang)


### Features

- Open dashboard in popup window (Tomo Wang)

- Apply Flowser design spec tokens, fonts, and shadcn primitives (Tomo Wang)

- Color-code node cards, edges, and the Add Node panel by category (Tomo Wang)

- Apply theme fonts and flat-card styling to workflow list and sidebar (Tomo Wang)

- Replace hardcoded gray classes with theme tokens and fonts (Tomo Wang)

- Unify page title typography across list/detail views (Tomo Wang)

- Align page container padding and header button position (Tomo Wang)

- Extend font-display/font-mono convention to remaining UI (Tomo Wang)

- Add GitHub, release, and store links to settings page (Tomo Wang)

- Add log retention setting and scheduled purge (Tomo Wang)

- Apply Flowser brand tokens to the VitePress site (Tomo Wang)


### Miscellaneous

- Ignore local pnpm store (Tomo Wang)


### Refactor

- Source AI provider icons from @thesvg/vue (Tomo Wang)

## [v1.2.0] - 2026-07-19


### Bug Fixes

- Respect displayOptions when validating required properties (Tomo Wang)


### CI/CD

- Generate release notes with git-cliff grouped by commit type (Tomo Wang)


### Documentation

- Add Firefox Add-ons badge to README (Tomo Wang)


### Features

- Add pagination and status/workflow filters to executions list (Tomo Wang)

- Show extension version in Settings page (Tomo Wang)

- Add TabGroupAction node with create action (Tomo Wang)

- Add light/dark/system theme switcher to Settings page (Tomo Wang)

- Add Fill Form node for form input actions (Tomo Wang)

- Add Google Search demo workflow (Tomo Wang)

- Support batch delete of selected execution logs (Tomo Wang)

- Add Placeholder node for pass-through workflow testing (Tomo Wang)

- Add n8n-style Schema/JSON switcher to node input panel (Tomo Wang)

- Add Schema/JSON switcher to node output panel (Tomo Wang)

- Add Wait For Resource node for element/HTTP/viewport waits (Tomo Wang)

- Use Wait For Resource in the Google Search demo workflow (Tomo Wang)


### Refactor

- Make node/credential code the single English source of truth (Tomo Wang)

## [v1.1.2] - 2026-07-08


### Bug Fixes

- Remove pnpm version pin conflicting with packageManager field (Tomo Wang)

## [v1.1.1] - 2026-07-08


### Bug Fixes

- Correct shadcn-vue css path in components.json (Tomo Wang)

- Upgrade reka-ui to fix dropdown menu selection issue (Tomo Wang)


### Documentation

- Add badge and store link in README (Tomo Wang)


### Miscellaneous

- Declare no data collection in Firefox manifest (Tomo Wang)

- Pin packageManager (Tomo Wang)

- Migrate lucide-vue-next to @lucide/vue (Tomo Wang)

- Bump @lucide/vue version pin to match installed release (Tomo Wang)

- Bump dependency versions (Tomo Wang)


### Styling

- Remove unused accordion animation keyframes (Tomo Wang)

## [v1.1.0] - 2026-06-29


### Bug Fixes

- Fix bundler optimizer issues and register i18n in popup (Tomo Wang)

- Ensure master key verification always works even when credentials DB is empty (Tomo Wang)

- Prevent master key input dialog from being cancelled (Tomo Wang)

- Execute popup workflows in background to prevent cancellation on dismissal (Tomo Wang)


### Documentation

- Add execution engine documentation (Tomo Wang)

- Add store listing assets and description (Tomo Wang)


### Features

- Import initial workflows on install (Tomo Wang)

- Prompt for initial master password on first launch (Tomo Wang)

- Add execute button to workflow card in list view (Tomo Wang)

## [v1.0.0] - 2026-04-26


### Bug Fixes

- Typo and props (Tomo Wang)

- Fix edge marker position not v-middle (Tomo Wang)

- Execution result panel resize handler height issue (Tomo Wang)

- Fix import in test (Tomo Wang)

- Update test (Tomo Wang)

- Fix expression interpret issue (Tomo Wang)

- Improve empty credential list state in NodeInspector (Tomo Wang)

- Prevent unnecessary workflow save on name blur (Tomo Wang)

- Fix missing field in test (Tomo Wang)

- Prevent inactive workflows from being triggered (Tomo Wang)

- Fix toast style & update location (Tomo Wang)

- Master key availability in popup and session persistence (Tomo Wang)

- Add credential validation to node settings (Tomo Wang)

- Show toast when manual trigger is missing (Tomo Wang)

- Do not save executionStatus of node (Tomo Wang)

- Ignore execution stats in save state check (Tomo Wang)

- Use updateState for adding nodes and cleanup comments (Tomo Wang)

- Trigger workflow update when node data changes in modal (Tomo Wang)

- Use per-item index in getNodeParameter expression evaluation (Tomo Wang)

- Resolve #imports resolution issue by using top-level imports (Tomo Wang)

- Resolve icon prop type validation warning (Tomo Wang)

- Resolve Gemini logo SVG path rendering error (Tomo Wang)

- Resolve QuickJS WASM loading and CSP errors (Tomo Wang)

- Suppress expected extension connection errors and clean up background init (Tomo Wang)

- Resolve storage variable shadowing and fix TypeError in background script (Tomo Wang)

- Persist master key wrapping key to session storage (Tomo Wang)

- Use relative positioning for quick-add nodes to ensure consistent spacing (Tomo Wang)


### CI/CD

- Add GitHub Actions workflow to trigger build on version tags (Tomo Wang)

- Add github action for pages deployment (Tomo Wang)

- Trigger deploy on v tags (Tomo Wang)

- Add write permission for releases (Tomo Wang)


### Documentation

- Update readme (Tomo Wang)

- README (Tomo Wang)

- Add prettier format rule (Tomo Wang)

- Add localization standards for future development (Tomo Wang)

- Basic structure (Tomo Wang)

- Add detailed documentation for each node type (Tomo Wang)

- Add favicon to documentation (Tomo Wang)

- Update home page and list features (Tomo Wang)

- Fix dead link to agent node documentation (Tomo Wang)


### Features

- Basic node interface and runner and editor page (Tomo Wang)

- Storage API and workflow store (Tomo Wang)

- Cluster node type that support multi-inputs (Tomo Wang)

- Node connect verification (Tomo Wang)

- Credential management and secure save (Tomo Wang)

- Refactor to use SPA and vue router for page (Tomo Wang)

- Refactor the layout and style of workflow editor (Tomo Wang)

- Validate master key when prompt (Tomo Wang)

- Use background worker for HTTP requests (Tomo Wang)

- Execution result panel (Tomo Wang)

- Workflow execution logs in db (Tomo Wang)

- Code node using quickjs-emscripten (Tomo Wang)

- Resizable and collapsable execution result panel (Tomo Wang)

- Display input & ouput using vue-json-pretty (Tomo Wang)

- I18n except node (Tomo Wang)

- Render icons in nodes and node panel (Tomo Wang)

- Use dialog to display node properties (Tomo Wang)

- Tab query node (Tomo Wang)

- Support expression eval in parameters (Tomo Wang)

- Add tabClose node (Tomo Wang)

- Show errors using toaster (Tomo Wang)

- Logo and name & description (Tomo Wang)

- Use codemirror for code editor (Tomo Wang)

- Agent and lm model implementation (Tomo Wang)

- Populate default paramaters when node added (Tomo Wang)

- More lm nodes (Tomo Wang)

- Inline workflow name edit (Tomo Wang)

- Button style and status for workflow save and run (Tomo Wang)

- Support add credentials in node inspector (Tomo Wang)

- Use select component from shadcn-vue (Tomo Wang)

- TabCreated trigger node (Tomo Wang)

- ClickElement node (Tomo Wang)

- Save workflow when name input blur (Tomo Wang)

- Support workflow active/inactive toggle in editor (Tomo Wang)

- Save and display workflow mini-map screenshot (Tomo Wang)

- Refine workflow list UI and add preview generation (Tomo Wang)

- Add breadcrumb navigation (Tomo Wang)

- Add Tailwind size indicator in dev mode (Tomo Wang)

- Switch to official deepseek sdk (Tomo Wang)

- Support to save resule panel size (Tomo Wang)

- Limit connection counts for main/model/memory inputs (Tomo Wang)

- Add workflow execution visualization (Tomo Wang)

- Improve workflow preview and add fallback logo (Tomo Wang)

- Add TabCreate node (Tomo Wang)

- Add WindowCreate node (Tomo Wang)

- Add WindowQuery node (Tomo Wang)

- Disable save button when no changes (Tomo Wang)

- Popup window and workflow list (Tomo Wang)

- Validate node settings and block execution on invalid nodes (Tomo Wang)

- Add Wait node (Tomo Wang)

- Update HttpRequest node with headers, query params and body support (Tomo Wang)

- Remove CalculatorTool node (Tomo Wang)

- Add TestNode and DemoCredential for development environment (Tomo Wang)

- Add WindowClose node (Tomo Wang)

- Add support for editing credentials (Tomo Wang)

- Add git-commit skill (Tomo Wang)

- Add FetchContent node (Tomo Wang)

- Add schedule trigger node with cron support (Tomo Wang)

- Populate default credential values (Tomo Wang)

- Validate nodes on workflow load & require credential for TestNode (Tomo Wang)

- Add EditFields node for field manipulation (Tomo Wang)

- Support editable node name and unique naming (Tomo Wang)

- Implement drag-to-select and improve panning UX (Tomo Wang)

- Implement undo/redo for workflow editor (Tomo Wang)

- Support incremental node execution updates (Tomo Wang)

- Implement data table feature (Tomo Wang)

- Implement fixed/expression style input (Tomo Wang)

- Add data table node (Tomo Wang)

- Add TabGroupQuery node and permissions (Tomo Wang)

- Implement displayOptions and merge Tab nodes into TabAction (Tomo Wang)

- Support drag and drop column reordering in datatable edit page (Tomo Wang)

- Support integer sequence for datatable rows and show row id (Tomo Wang)

- Support group action in TabAction node (Tomo Wang)

- Add If node (Tomo Wang)

- Support dynamic option fetching for AI models (Tomo Wang)

- Support dynamic option fetching for Claude, DeepSeek and OpenAI (Tomo Wang)

- Add master key input to popup (Tomo Wang)

- Allow adding fields one by one in EditFields node (Tomo Wang)

- Add CodeMirror autocompletion for Code nodes and expressions (Tomo Wang)

- Support downloading workflow as JSON config (Tomo Wang)

- Support importing workflow from JSON file (Tomo Wang)

- Support SVG logos for AI model nodes (Tomo Wang)

- Adopt brand logos and standardized naming convention (Tomo Wang)

- Enable grid snapping for precise node movement (Tomo Wang)

- Add 'Tab Updated' trigger and background listener (Tomo Wang)

- Refactor If node conditions to structured UI with grid layout (Tomo Wang)

- Implement recursive parameter evaluation for fixedCollection types (Tomo Wang)

- Display True/False branch labels for If nodes (Tomo Wang)

- Expand JSON input/output by default in execution detail and node properties (Tomo Wang)

- Add support for $(...) syntax in Code node (Tomo Wang)

- Add textarea support and expand code/prompt editor sizes (Tomo Wang)

- Add quick connect triggers and improved node selection panel (Tomo Wang)

- Allow selecting and previewing output from any upstream node (Tomo Wang)

- Refactor If node to support hierarchical operator selection with icons (Tomo Wang)

- Move node name edit to properties modal header (Tomo Wang)

- Ensure unique node names on add and validate on save (Tomo Wang)

- Quick add plus button is now in right ouput and bottom input and draggable (Tomo Wang)

- Use orthogonal lines for backward edges (Tomo Wang)

- Add keyboard shortcuts for save, undo, and redo (Tomo Wang)

- Support single node execution with recursive predecessor checks (Tomo Wang)

- Comprehensive localization of UI and node/credential properties (Tomo Wang)

- Add dynamic routes and sidebar for node documentation (Tomo Wang)


### Miscellaneous

- License (Tomo Wang)

- Basic wxt project using vue (Tomo Wang)

- Install shadcn vue and button component (Tomo Wang)

- Install prettier and format files (Tomo Wang)

- Vue-flow (Tomo Wang)

- Tab size 2 and browser persistent data setting (Tomo Wang)

- Clean up (Tomo Wang)

- Main canvas and execution panel share vertical space (Tomo Wang)

- Remove color property of node (Tomo Wang)

- Agent rule (Tomo Wang)

- Show error message when run node raise exception (Tomo Wang)

- Upgrade wxt and remove wxt/storage override (Tomo Wang)

- Display type name in credential list page (Tomo Wang)

- Update node handler order (Tomo Wang)

- Add style and markers for edge connections (Tomo Wang)

- Update style for top/bottom handler (Tomo Wang)

- Eslint (Tomo Wang)

- Add .editorconfig to align with prettier settings (Tomo Wang)

- Update scope for commit message (Tomo Wang)

- Fix lint errors and improve type safety across the project (Tomo Wang)

- Add husky and lint-staged for pre-commit linting (Tomo Wang)

- Update all dependencies to latest versions (Tomo Wang)

- Rename .agent to .agents for better AI tool compatibility (Tomo Wang)

- Fix lint errors (Tomo Wang)

- Remove packageManager from package.json (Tomo Wang)


### Refactor

- Run for each items (Tomo Wang)

- Remove `run` method of INodeType (Tomo Wang)

- Use resizable component from shadcn-vue (Tomo Wang)

- Separate credential define to support specific properties (Tomo Wang)

- Reorganize node groups, add search expansion, and grouping UI (Tomo Wang)

- Merge Tab and Window node groups into Browser group (Tomo Wang)

- Support password type for credential properties (Tomo Wang)

- Use unique execution ID for node results to support loops (Tomo Wang)

- Use number type for numeric properties (Tomo Wang)

- Update sidebar and header layout (Tomo Wang)

- Move each node into its own folder (Tomo Wang)


### Security

- Use stored random salt for key derivation (Tomo Wang)

- Increase PBKDF2 iterations to 600,000 for better brute-force resistance (Tomo Wang)

- Add background sender validation and restore master key on startup (Tomo Wang)

- Implement double-wrapping for master key session storage (Tomo Wang)


### Styling

- Change toast notification position to top-right (Tomo Wang)

- Display bottom input labels directly instead of on hover (Tomo Wang)

- Update workflow export/import wording and icons (Tomo Wang)


### Testing

- Implement comprehensive testing strategy and expand coverage (Tomo Wang)


