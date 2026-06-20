# Vault Desktop — UI Kit

A high-fidelity recreation of the **Electron desktop vault app**
(`apps/desktop` in `LucasN0820/password-management`).

`index.html` is interactive — click the sidebar to move between **首页 (Home)**,
**密码库 (Passwords)**, and **生成器 (Generator)**. In Passwords, click any list
row to load its detail; toggle the password visibility and the favorite star;
search filters the list. In the Generator, drag the length slider and flip the
character-set switches to regenerate live.

## Layout
The signature three-pane shell, under a 25px Electron title bar:
`Sidebar (256px) → Password list (320px) → Detail pane (fluid)`.

## Composes
Bundle components: `Button`, `Input`, `Switch`, `Slider`, `Card`, `Badge`,
`Avatar`, `StrengthMeter`, `PasswordRow`, `Keycap`. Icons are Lucide
(pre-rendered to an SVG map for re-render safety). Tokens come from the root
`styles.css`.

## Not included
AI-import and Settings routes are stubbed (placeholder panels) — the kit focuses
on the three core surfaces. The real app also has a ⌘⇧P spotlight overlay and an
add/edit modal; ask if you'd like those built out.
