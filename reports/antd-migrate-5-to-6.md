# Migration Guide: antd v5 → v6

> 42 total steps: 4 auto-fixable, 38 manual

## Global

### React >= 18 required. React 17 and earlier are no longer supported.

**BREAKING** | 📝 manual

1. Upgrade React to 18 or above
2. Remove @ant-design/v5-patch-for-react-19 if present (no longer needed)

**Before:**
```tsx
import '@ant-design/v5-patch-for-react-19';
```

**After:**
```tsx
// Remove this import — no longer needed in v6
```

**Search pattern:** `@ant-design/v5-patch-for-react-19`

### @ant-design/icons must be upgraded to v6. Icons v6 is not compatible with antd v5.

**BREAKING** | 📝 manual

1. Run: npm install @ant-design/icons@6
2. @ant-design/icons@6 is NOT compatible with antd@5 — upgrade both together
3. If build errors occur, verify icon package version matches antd version

### CSS variables enabled by default. Only modern browsers supported, IE is not supported.

**BREAKING** | 📝 manual

Verify your target browsers support CSS variables. IE and some older domestic browsers may have issues.

### DOM structure of many components optimized. Custom styles targeting internal DOM nodes may need adjustment.

non-breaking | 📝 manual

If your project has CSS that targets component internal DOM nodes (specific selectors or hierarchy), inspect and adjust after upgrading.

### Modal/Drawer mask blur enabled by default. Disable via ConfigProvider if undesired.

non-breaking | 📝 manual

If you don't want the mask blur effect:
<ConfigProvider modal={{ mask: { blur: false } }} drawer={{ mask: { blur: false } }}>
  <App />
</ConfigProvider>

## Button

### Prop `type` split into `color` and `variant` for styling. `type="primary"` → `color="primary" variant="solid"`.

**BREAKING** | 🔧 auto-fixable

Button type prop is decomposed:
- type="primary" → color="primary" variant="solid" (or just keep type="primary" as alias)
- type="dashed" → variant="dashed"
- type="link" → variant="link"
- type="text" → variant="text"
- type="default" → no change needed

**Before:**
```tsx
<Button type="primary">Submit</Button>
<Button type="dashed">Dashed</Button>
<Button type="link">Link</Button>
<Button type="text">Text</Button>
```

**After:**
```tsx
<Button color="primary" variant="solid">Submit</Button>
<Button variant="dashed">Dashed</Button>
<Button variant="link">Link</Button>
<Button variant="text">Text</Button>
```

**Search pattern:** `<Button[^>]*\btype\s*=\s*['"](?:primary|dashed|link|text)['"]`

### Prop `danger` removed. Use `color="danger"` instead.

**BREAKING** | 🔧 auto-fixable

Search for all Button components with `danger` prop. Replace with `color="danger"`. If the button also had `type="primary"`, add `variant="solid"`.

**Before:**
```tsx
<Button danger>Delete</Button>
<Button type="primary" danger>Delete</Button>
```

**After:**
```tsx
<Button color="danger">Delete</Button>
<Button color="danger" variant="solid">Delete</Button>
```

**Search pattern:** `<Button[^>]*\bdanger\b`

### Prop `ghost` removed. Use `variant="outlined"` instead.

**BREAKING** | 🔧 auto-fixable

Search for all Button components with `ghost` prop. Replace with `variant="outlined"`. Preserve the color from the original `type` prop.

**Before:**
```tsx
<Button ghost>Ghost</Button>
<Button type="primary" ghost>Ghost Primary</Button>
```

**After:**
```tsx
<Button variant="outlined">Ghost</Button>
<Button color="primary" variant="outlined">Ghost Primary</Button>
```

**Search pattern:** `<Button[^>]*\bghost\b`

### `iconPosition` deprecated, use `iconPlacement` instead.

non-breaking | 🔧 auto-fixable

**Before:**
```tsx
<Button iconPosition="end">Click</Button>
```

**After:**
```tsx
<Button iconPlacement="end">Click</Button>
```

**Search pattern:** `<Button[^>]*\biconPosition\b`

## Button.Group

### `Button.Group` deprecated, use `Space.Compact` instead.

non-breaking | 📝 manual

**Before:**
```tsx
<Button.Group><Button>A</Button><Button>B</Button></Button.Group>
```

**After:**
```tsx
<Space.Compact><Button>A</Button><Button>B</Button></Space.Compact>
```

**Search pattern:** `Button\.Group`

## Alert

### `closeText` deprecated → `closable.closeIcon`; `message` deprecated → `title`.

non-breaking | 📝 manual

- closeText="Close" → closable={{ closeIcon: "Close" }}
- message="Title" → title="Title"

**Search pattern:** `<Alert[^>]*\b(closeText|message)\s*=`

## Anchor

### `Anchor` children usage deprecated, use `items` prop instead.

non-breaking | 📝 manual

Replace Anchor children with items prop array.

**Search pattern:** `<Anchor>\s*<Anchor\.Link`

## AutoComplete

### Multiple deprecated props: `dropdownMatchSelectWidth` → `popupMatchSelectWidth`, `dropdownClassName` → `classNames.popup.root`, `dropdownRender` → `popupRender`, `dataSource` → `options`.

non-breaking | 📝 manual

- dropdownMatchSelectWidth → popupMatchSelectWidth
- dropdownClassName / popupClassName → classNames.popup.root
- dropdownStyle → styles.popup.root
- dropdownRender → popupRender
- onDropdownVisibleChange → onOpenChange
- dataSource → options

**Search pattern:** `<AutoComplete[^>]*\b(dropdownMatchSelectWidth|dropdownClassName|dropdownStyle|dropdownRender|onDropdownVisibleChange|dataSource)\b`

## Avatar.Group

### `maxCount`/`maxStyle`/`maxPopoverPlacement`/`maxPopoverTrigger` deprecated, use `max` prop object.

non-breaking | 📝 manual

**Before:**
```tsx
<Avatar.Group maxCount={3} maxStyle={{ color: 'red' }}>
```

**After:**
```tsx
<Avatar.Group max={{ count: 3, style: { color: 'red' } }}>
```

**Search pattern:** `<Avatar\.Group[^>]*\b(maxCount|maxStyle|maxPopoverPlacement|maxPopoverTrigger)\b`

## Breadcrumb

### `routes` deprecated → `items`; `Breadcrumb.Item` / `Breadcrumb.Separator` deprecated → `items`.

non-breaking | 📝 manual

Replace Breadcrumb children or routes prop with items array.

**Search pattern:** `(Breadcrumb\.Item|Breadcrumb\.Separator|<Breadcrumb[^>]*\broutes\b)`

## Calendar

### `dateFullCellRender`/`dateCellRender`/`monthFullCellRender`/`monthCellRender` deprecated → `fullCellRender`/`cellRender`.

non-breaking | 📝 manual

**Search pattern:** `<Calendar[^>]*\b(dateFullCellRender|dateCellRender|monthFullCellRender|monthCellRender)\b`

## Card

### `headStyle` → `styles.header`; `bodyStyle` → `styles.body`; `bordered` → `variant`.

non-breaking | 📝 manual

- headStyle → styles.header
- bodyStyle → styles.body
- bordered={false} → variant="borderless"

**Search pattern:** `<Card[^>]*\b(headStyle|bodyStyle|bordered)\b`

## Cascader

### Multiple deprecated props: `dropdownClassName` → `classNames.popup.root`, `bordered` → `variant`, `onPopupVisibleChange` → `onOpenChange`.

non-breaking | 📝 manual

**Search pattern:** `<Cascader[^>]*\b(dropdownClassName|dropdownStyle|dropdownRender|dropdownMenuColumnStyle|onDropdownVisibleChange|onPopupVisibleChange|bordered)\b`

## Collapse

### `destroyInactivePanel` → `destroyOnHidden`; `expandIconPosition` → `expandIconPlacement`.

non-breaking | 📝 manual

**Search pattern:** `<Collapse[^>]*\b(destroyInactivePanel|expandIconPosition)\b`

## DatePicker

### Multiple deprecated props: `popupClassName` → `classNames.popup.root`, `bordered` → `variant`, `onSelect` → `onCalendarChange`.

non-breaking | 📝 manual

**Search pattern:** `<(DatePicker|RangePicker)[^>]*\b(dropdownClassName|popupClassName|popupStyle|bordered|onSelect)\b`

## Descriptions

### `labelStyle` → `styles.label`; `contentStyle` → `styles.content`.

non-breaking | 📝 manual

**Search pattern:** `<Descriptions[^>]*\b(labelStyle|contentStyle)\b`

## Divider

### `type` deprecated → `orientation`; `orientationMargin` → `styles.content.margin`.

non-breaking | 📝 manual

**Search pattern:** `<Divider[^>]*\b(type\s*=|orientationMargin)\b`

## Drawer

### Style props deprecated: `headerStyle`/`bodyStyle`/`footerStyle`/`maskStyle`/`drawerStyle`/`contentWrapperStyle` → `styles.*`; `width`/`height` → `size`; `destroyInactivePanel` → `destroyOnHidden`.

non-breaking | 📝 manual

- headerStyle → styles.header
- bodyStyle → styles.body
- footerStyle → styles.footer
- contentWrapperStyle → styles.wrapper
- maskStyle → styles.mask
- drawerStyle → styles.section
- width/height → size
- destroyInactivePanel → destroyOnHidden

**Search pattern:** `<Drawer[^>]*\b(headerStyle|bodyStyle|footerStyle|contentWrapperStyle|maskStyle|drawerStyle|destroyInactivePanel)\b`

## Dropdown

### `overlayClassName` → `classNames.root`; `overlayStyle` → `styles.root`; `destroyPopupOnHide` → `destroyOnHidden`. `Dropdown.Button` deprecated → `Space.Compact + Dropdown + Button`.

non-breaking | 📝 manual

**Search pattern:** `(Dropdown\.Button|<Dropdown[^>]*\b(overlayClassName|overlayStyle|destroyPopupOnHide|dropdownRender)\b)`

## Form

### `onFinish` no longer includes all Form.List data. Unregistered Form.Item fields are excluded.

**BREAKING** | 📝 manual

In v5, Form.List was treated as a single Field, causing onFinish to include all data.
In v6, only registered Form.Item fields are included.
You no longer need getFieldsValue({ strict: true }) to filter.

**Before:**
```tsx
const onFinish = (values) => {
  const realValues = getFieldsValue({ strict: true });
};
```

**After:**
```tsx
const onFinish = (values) => {
  const realValues = values; // Already filtered in v6
};
```

## Image

### `visible` → `open`; `onVisibleChange` → `onOpenChange`; `wrapperStyle` → `styles.root`; `maskClassName` → `classNames.cover`; `toolbarRender` → `actionsRender`.

non-breaking | 📝 manual

**Search pattern:** `<Image[^>]*\b(visible|onVisibleChange|wrapperStyle|maskClassName|rootClassName|toolbarRender)\b`

## Input.Group

### `Input.Group` deprecated, use `Space.Compact` instead.

non-breaking | 📝 manual

**Before:**
```tsx
<Input.Group compact><Input /><Input /></Input.Group>
```

**After:**
```tsx
<Space.Compact><Input /><Input /></Space.Compact>
```

**Search pattern:** `Input\.Group`

## Menu

### `children` deprecated, use `items` prop instead.

non-breaking | 📝 manual

**Search pattern:** `<Menu>\s*<Menu\.Item`

## Modal

### `bodyStyle` → `styles.body`; `maskStyle` → `styles.mask`; `destroyOnClose` → `destroyOnHidden`.

non-breaking | 📝 manual

**Search pattern:** `<Modal[^>]*\b(bodyStyle|maskStyle|destroyOnClose)\b`

## notification

### `btn` deprecated → `actions`; `message` deprecated → `title`.

non-breaking | 📝 manual

**Search pattern:** `notification\.(open|success|error|info|warning)\(\{[^}]*(\bbtn\b|\bmessage\b)`

## Progress

### `strokeWidth`/`width` → `size`; `trailColor` → `railColor`; `gapPosition` → `gapPlacement`.

non-breaking | 📝 manual

**Search pattern:** `<Progress[^>]*\b(strokeWidth|trailColor|gapPosition)\b`

## Select

### Multiple deprecated props: `dropdownClassName` → `classNames.popup.root`, `dropdownRender` → `popupRender`, `bordered` → `variant`, `onDropdownVisibleChange` → `onOpenChange`.

non-breaking | 📝 manual

**Search pattern:** `<Select[^>]*\b(dropdownClassName|dropdownStyle|dropdownRender|onDropdownVisibleChange|bordered)\b`

## Slider

### Tooltip props deprecated: `tooltipPrefixCls` → `tooltip.prefixCls`, `tipFormatter` → `tooltip.formatter`, `tooltipVisible` → `tooltip.open`, `tooltipPlacement` → `tooltip.placement`.

non-breaking | 📝 manual

**Search pattern:** `<Slider[^>]*\b(tooltipPrefixCls|tipFormatter|tooltipVisible|tooltipPlacement|getTooltipPopupContainer)\b`

## Space

### `direction` → `orientation`; `split` → `separator`.

non-breaking | 📝 manual

**Search pattern:** `<Space[^>]*\b(direction|split)\s*=`

## Steps

### `labelPlacement` → `titlePlacement`; `progressDot` → `type="dot"`; `direction` → `orientation`; `items.description` → `items.content`.

non-breaking | 📝 manual

**Search pattern:** `<Steps[^>]*\b(labelPlacement|progressDot|direction)\b`

## Table

### `pagination.position` → `pagination.placement`; `filterDropdownOpen` → `filterDropdownProps.open`; `onFilterDropdownOpenChange` → `filterDropdownProps.onOpenChange`.

non-breaking | 📝 manual

**Search pattern:** `(filterDropdownOpen|onFilterDropdownOpenChange|filterCheckall)`

## Tabs

### `tabPosition` → `tabPlacement`; `destroyInactiveTabPane` → `destroyOnHidden`; `Tabs.TabPane` deprecated → `items`.

non-breaking | 📝 manual

**Search pattern:** `(Tabs\.TabPane|<Tabs[^>]*\b(tabPosition|destroyInactiveTabPane)\b)`

## Tag

### Default trailing margin removed. `bordered={false}` → `variant="filled"`; `color="xxx-inverse"` → `variant="solid"`.

**BREAKING** | 📝 manual

- Tag trailing margin removed. Add margin via ConfigProvider tag.styles if needed.
- bordered={false} → variant="filled"
- color="xxx-inverse" → variant="solid"

**Search pattern:** `<Tag[^>]*\b(bordered|color\s*=\s*['"][^'"]*-inverse)`

## Timeline

### `Timeline.Item` deprecated → `items`; `pending`/`pendingDot` deprecated → `items`; `mode=left|right` → `mode=start|end`.

non-breaking | 📝 manual

**Search pattern:** `(Timeline\.Item|<Timeline[^>]*\b(pending|pendingDot|mode\s*=\s*['"](?:left|right))\b)`

## Tooltip

### `overlayStyle` → `styles.root`; `overlayInnerStyle` → `styles.container`; `overlayClassName` → `classNames.root`; `destroyTooltipOnHide` → `destroyOnHidden`.

non-breaking | 📝 manual

**Search pattern:** `<Tooltip[^>]*\b(overlayStyle|overlayInnerStyle|overlayClassName|destroyTooltipOnHide)\b`

## Transfer

### `listStyle` → `styles.section`; `operationStyle` → `styles.actions`; `operations` → `actions`.

non-breaking | 📝 manual

**Search pattern:** `<Transfer[^>]*\b(listStyle|operationStyle|operations)\b`

## TreeSelect

### Multiple deprecated props: `dropdownClassName` → `classNames.popup.root`, `dropdownRender` → `popupRender`, `bordered` → `variant`, `onDropdownVisibleChange` → `onOpenChange`.

non-breaking | 📝 manual

**Search pattern:** `<TreeSelect[^>]*\b(dropdownClassName|dropdownStyle|dropdownRender|onDropdownVisibleChange|bordered)\b`

