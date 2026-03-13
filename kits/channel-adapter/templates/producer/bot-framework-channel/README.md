# __CHANNEL_DISPLAY_NAME__ Channel (Bot Framework)

A Bot Framework-compatible MSR Agent channel. Use this template when your platform speaks the Bot Framework protocol (Teams, M365 Agents, Copilot Studio, etc.).

## Quick Start

```bash
npm install
npm run dev
```

## Key Differences from Express Template

- Uses Bot Framework Activity model as native types
- Maps Activity types (`message`, `composeExtension/*`) to MSR request types
- Formats responses as Adaptive Cards
- Non-streaming (Bot Framework handles response buffering)

## Setup Checklist

- [ ] Replace placeholder channel name/ID in `src/adapter.ts`
- [ ] Add your channel type to `ChannelType` in `packages/channel-adapter/src/protocol.ts`
- [ ] Register adapter in `packages/channel-adapter/src/factory.ts`
- [ ] Add Bot Framework authentication verification
- [ ] Customize Activity → `pub()` mapping for your Activity extensions
- [ ] Customize Adaptive Card generation in `sub()` for your platform's card needs
- [ ] Set up Bot Framework registration (Azure Bot Service)
