The brand's primary call to action — an orange pill with a circular arrow badge on the right. Use for anything that advances the learner or visitor.

```jsx
<Button size="lg">View my work</Button>
<Button variant="secondary">Let's talk</Button>
<Button variant="ghost" arrow="up-right">Hire me</Button>
<Button arrow={false} variant="outline">Cancel</Button>
```

Variants: `primary` (orange, has --shadow-brand), `secondary` (near-black), `ghost`, `outline`. Sizes 32/40/48px. `arrow="up-right"` for outbound or new-context actions; `arrow={false}` for dense/secondary use. Never ALL CAPS labels.