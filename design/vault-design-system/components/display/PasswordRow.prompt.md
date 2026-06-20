PasswordRow — a single entry in the password list: icon tile, title + username, favorite star (shown on hover or when favorited), trailing time. `selected` paints the warm active fill.

```jsx
<PasswordRow title="Google" username="hello@example.com" letter="G" tone="#E8F0FE" timeAgo="2h" favorite selected />
<PasswordRow title="Netflix" username="hello@example.com" letter="N" tone="#FDE8E7" timeAgo="1d" />
```

Composes the `Avatar` primitive for the icon tile.
