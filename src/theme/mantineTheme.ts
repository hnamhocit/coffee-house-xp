import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Bảng màu xanh tre tự nhiên (Deep Bamboo Green)
// Độ tương phản cao, dịu mắt, chống chói lóa
const bambooGreen: MantineColorsTuple = [
  '#eff7f1', // 0: Nền nhẹ, badge tint
  '#dcf0e2', // 1: Viền nhẹ
  '#b8d7be', // 2: Border nhấn
  '#86bf92', // 3: Xanh mạ non
  '#55a366', // 4: Xanh lá tre tươi
  '#358448', // 5: Xanh lá cây tự nhiên
  '#226135', // 6: Primary Brand Green (Nút bấm chính)
  '#1a4c2a', // 7: Hover state, màu viền đậm
  '#143820', // 8: Tiêu đề đậm đà
  '#0e2616', // 9: Xanh rêu đậm nhất
];

// Màu phụ: Nâu gỗ mộc & hạt cà phê (Earthy Coffee Wood)
const coffeeAmber: MantineColorsTuple = [
  '#faf6f0',
  '#f1e8dd',
  '#dfcfbc',
  '#cbb298',
  '#ba9877',
  '#af865e',
  '#9a7047',
  '#7d5733',
  '#634427',
  '#4a311a',
];

export const theme = createTheme({
  primaryColor: 'bamboo',
  colors: {
    bamboo: bambooGreen,
    coffee: coffeeAmber,
  },
  fontFamily: '"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  headings: {
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2.3rem', lineHeight: '1.2' },
      h2: { fontSize: '1.85rem', lineHeight: '1.25' },
      h3: { fontSize: '1.35rem', lineHeight: '1.3' },
      h4: { fontSize: '1.15rem', lineHeight: '1.35' },
    },
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        padding: 'md',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
      },
    },
    Drawer: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});
