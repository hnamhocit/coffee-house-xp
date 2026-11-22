import React, { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  TextInput,
  Tabs,
  Badge,
  Card,
  SimpleGrid,
  Group,
  Button,
  ActionIcon,
  Modal,
  Radio,
  Stack,
  Textarea,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconPlus,
  IconMinus,
  IconShoppingCartPlus,
  IconCup,
  IconSparkles,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  MENU_ITEMS,
  CATEGORIES,
  type MenuItem,
  type MenuCategory,
} from '../data/menuData';
import { fuzzyMatchVietnamese, getSearchRelevanceScore } from '../utils/vietnameseSearch';

interface MenuSectionProps {
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    ice?: string,
    sugar?: string,
    note?: string
  ) => void;
  items?: MenuItem[];
  interactive: boolean;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ onAddToCart, items, interactive }) => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sourceItems = items ?? MENU_ITEMS;

  // Selected item modal state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = sourceItems.find((item) => item.id === selectedItemId);
  const [selectedIce, setSelectedIce] = useState('100% Đá');
  const [selectedSugar, setSelectedSugar] = useState('100% Đường');
  const [customNote, setCustomNote] = useState('');
  const [customQuantity, setCustomQuantity] = useState(1);

  // Filtered and sorted items (Fuzzy Vietnamese Search & Best Sellers prioritized)
  const filteredItems = useMemo(() => {
    const list = sourceItems.filter((item) => {
      // Category filter
      if (selectedCategory === 'best-seller') {
        if (item.badge !== 'Best Seller' && item.badge !== 'Ưu Đãi') return false;
      } else if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Fuzzy & Vietnamese Accent-Insensitive Search
      if (searchQuery.trim() !== '') {
        return fuzzyMatchVietnamese(
          searchQuery,
          item.name,
          `${item.category} ${item.badge || ''}`
        );
      }
      return true;
    });

    // Nếu đang tìm kiếm, sắp xếp các món khớp chính xác / liên quan nhất lên đầu
    if (searchQuery.trim() !== '') {
      return [...list].sort((a, b) => {
        const scoreB = getSearchRelevanceScore(searchQuery, b.name, b.category);
        const scoreA = getSearchRelevanceScore(searchQuery, a.name, a.category);
        return scoreB - scoreA;
      });
    }

    // Ưu tiên hiển thị các món Best Seller & Ưu đãi lên trước tiên
    return [...list].sort((a, b) => {
      const isBestA = a.badge === 'Best Seller' || a.badge === 'Ưu Đãi';
      const isBestB = b.badge === 'Best Seller' || b.badge === 'Ưu Đãi';
      if (isBestA && !isBestB) return -1;
      if (!isBestA && isBestB) return 1;
      return 0;
    });
  }, [selectedCategory, searchQuery, sourceItems]);

  // Handle clicking on any drink card to select it
  const handleSelectDrink = (item: MenuItem) => {
    if (item.available === false) return;
    setSelectedItemId(item.id);
    setSelectedIce('100% Đá');
    setSelectedSugar('100% Đường');
    setCustomNote('');
    setCustomQuantity(1);
  };

  // Add to cart from modal
  const handleAddToCartConfirm = () => {
    if (!selectedItem || selectedItem.available === false) return;

    onAddToCart(
      selectedItem,
      customQuantity,
      selectedItem.allowCustomization ? selectedIce : undefined,
      selectedItem.allowCustomization ? selectedSugar : undefined,
      customNote.trim() || undefined
    );

    notifications.show({
      title: 'Đã thêm vào giỏ hàng!',
      message: `${customQuantity}x ${selectedItem.name} (${(selectedItem.price * customQuantity).toLocaleString('vi-VN')} đ)`,
      color: 'bamboo',
      icon: <IconCheck size={18} />,
    });

    setSelectedItemId(null);
  };

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <Box
      id="thuc-don"
      py={{ base: '2rem', md: '3rem' }}
      style={{
        backgroundColor: '#f8faf8',
        borderTop: '1px solid #e4ede5',
        borderBottom: '1px solid #e4ede5',
      }}
    >
      <Container size="lg">
        {/* Search Bar & Category Navigation */}
        <div style={{ marginBottom: '24px' }}>
          <TextInput
            aria-label="Tìm món"
            disabled={!interactive}
            placeholder="Tìm món, ví dụ cà phê muối"
            rightSection={
              searchQuery ? (
                <ActionIcon size="sm" variant="subtle" color="gray" aria-label="Xóa nội dung tìm kiếm" onClick={() => setSearchQuery('')}>
                  <IconX size={14} />
                </ActionIcon>
              ) : null
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            size="md"
            radius="md"
            mb="sm"
            style={{
              boxShadow: '0 2px 8px rgba(34, 97, 53, 0.05)',
            }}
          />

          <Tabs
            value={selectedCategory}
            onChange={(val) => setSelectedCategory((val as MenuCategory) || 'all')}
            variant="pills"
            color="bamboo"
          >
            <Tabs.List
              className="tabs-scrollable"
              justify="flex-start"
              style={{
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: '8px',
                gap: '8px',
              }}
            >
              {CATEGORIES.map((cat) => (
                <Tabs.Tab
                  key={cat.id}
                  value={cat.id}
                  disabled={!interactive}
                  style={{
                    fontWeight: 700,
                    fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)',
                    padding: '6px 14px',
                    whiteSpace: 'nowrap',
                    borderRadius: '20px',
                    flexShrink: 0,
                  }}
                >
                  {cat.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </div>

        {/* UNIFIED MENU GRID (ALL ITEMS WITH BEST SELLERS PRIORITIZED FIRST) */}
        <div>
          <Title order={2} size="h3" c="#14281b" mb="sm">
            {selectedCategory === 'all' ? 'Thực đơn' : CATEGORIES.find((category) => category.id === selectedCategory)?.label}
            {' '}({filteredItems.length} món)
          </Title>

          {filteredItems.length === 0 ? (
            <Card withBorder radius="md" py="3rem" style={{ textAlign: 'center', backgroundColor: '#ffffff' }}>
              <Text size="md" fw={600} c="#2c3f33" mb="xs">
                {searchQuery.trim() ? `Không tìm thấy món “${searchQuery.trim()}”` : 'Danh mục này chưa có món'}
              </Text>
              <Button
                variant="outline"
                color="bamboo"
                size="xs"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Xem toàn bộ menu
              </Button>
            </Card>
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing={{ base: 'xs', sm: 'md' }}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="full-photo-card"
                  data-sold-out={item.available === false || undefined}
                >
                  <button
                    type="button"
                    className="menu-item-action"
                    disabled={!interactive || item.available === false}
                    aria-label={`Chọn ${item.name}, ${formatPrice(item.price)}`}
                    onClick={() => handleSelectDrink(item)}
                  />
                  {/* Full Background Photo */}
                  <img
                    src={item.image}
                    alt=""
                    className="card-bg-img"
                    loading="lazy"
                  />

                  {/* Dark Gradient Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.92) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '10px 10px',
                    }}
                  >
                    {/* Top Badge */}
                    <div>
                      {item.available === false ? (
                        <Badge color="gray" variant="filled">Hết hàng</Badge>
                      ) : item.badge && (
                        <Badge
                          size="xs"
                          variant="filled"
                          color={item.badge === 'Best Seller' ? 'coffee' : 'bamboo'}
                          style={{
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                          }}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>

                    {/* Bottom Floating Title & Price */}
                    <div>
                      <Text
                        fw={800}
                        className="line-clamp-2"
                        style={{
                          color: '#ffffff',
                          fontFamily: 'var(--font-heading)',
                          fontSize: 'clamp(0.85rem, 3.2vw, 1.02rem)',
                          lineHeight: 1.25,
                          marginBottom: '4px',
                          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                          minHeight: '2.5em',
                        }}
                      >
                        {item.name}
                      </Text>

                      <Group justify="space-between" align="center" wrap="nowrap" gap={4}>
                        <Text
                          fw={800}
                          style={{
                            color: '#a3e4b2',
                            fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)',
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatPrice(item.price)}
                        </Text>

                        <ActionIcon
                          className="menu-quick-add"
                          variant="filled"
                          color="bamboo"
                          size={34}
                          radius="xl"
                          disabled={!interactive || item.available === false}
                          aria-label={`Thêm một phần ${item.name}`}
                          onClick={() => {
                            onAddToCart(item, 1, item.allowCustomization ? '100% Đá' : undefined, item.allowCustomization ? '100% Đường' : undefined);
                            notifications.show({ message: `Đã thêm 1 × ${item.name}`, color: 'bamboo' });
                          }}
                        >
                          <IconPlus size={17} />
                        </ActionIcon>
                      </Group>
                    </div>
                  </div>
                </div>
              ))}
            </SimpleGrid>
          )}
        </div>
      </Container>

      <Modal
        opened={!!selectedItem}
        onClose={() => setSelectedItemId(null)}
        title={
          <Group gap="xs">
            <IconCup size={20} color="#226135" />
            <Text fw={700} c="#14281b" size="md" style={{ fontFamily: 'var(--font-heading)' }}>
              Chi Tiết Món Đã Chọn
            </Text>
          </Group>
        }
        centered
        size="md"
        padding="md"
      >
        {selectedItem && (
          <Stack gap="md">
            {/* Drink preview card */}
            <div
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                backgroundColor: '#f8faf8',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e2ede4',
              }}
            >
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
              <div>
                <Text fw={800} size="md" c="#14281b" style={{ fontFamily: 'var(--font-heading)' }}>
                  {selectedItem.name}
                </Text>
                <Text fw={800} size="lg" c="#226135">
                  {formatPrice(selectedItem.price * customQuantity)}
                </Text>
              </div>
            </div>

            {/* Customization Options */}
            {selectedItem.allowCustomization && (
              <>
                {/* Ice option */}
                <div>
                  <Text fw={700} size="xs" c="#14281b" mb={6}>
                    Mức Đá:
                  </Text>
                  <Radio.Group value={selectedIce} onChange={setSelectedIce}>
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                      <Radio value="100% Đá" label="100% Đá" color="bamboo" size="sm" />
                      <Radio value="70% Đá" label="70% Đá" color="bamboo" size="sm" />
                      <Radio value="50% Đá" label="50% Đá" color="bamboo" size="sm" />
                      <Radio value="Đá Riêng" label="Đá riêng" color="bamboo" size="sm" />
                    </SimpleGrid>
                  </Radio.Group>
                </div>

                {/* Sugar option */}
                <div>
                  <Text fw={700} size="xs" c="#14281b" mb={6}>
                    Mức Ngọt / Đường:
                  </Text>
                  <Radio.Group value={selectedSugar} onChange={setSelectedSugar}>
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                      <Radio value="100% Đường" label="Ngọt Vừa" color="bamboo" size="sm" />
                      <Radio value="70% Đường" label="70%" color="bamboo" size="sm" />
                      <Radio value="50% Đường" label="Ít Ngọt" color="bamboo" size="sm" />
                      <Radio value="Không Đường" label="Không Đường" color="bamboo" size="sm" />
                    </SimpleGrid>
                  </Radio.Group>
                </div>

                {/* Note */}
                <div>
                  <Text fw={700} size="xs" c="#14281b" mb={4}>
                    Ghi chú cho quầy pha chế:
                  </Text>
                  <Textarea
                    placeholder="Ví dụ: Nhiều kem muối, để đá riêng, lấy thêm ly đá..."
                    maxLength={300}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.currentTarget.value)}
                    minRows={2}
                    maxRows={2}
                    radius="md"
                    size="sm"
                  />
                </div>
              </>
            )}

            {/* Quantity */}
            <Group justify="space-between" align="center">
              <Text fw={700} size="sm" c="#14281b">
                Số lượng:
              </Text>
              <Group gap="xs">
                <ActionIcon
                  size="md"
                  variant="default"
                  disabled={customQuantity <= 1}
                  aria-label="Giảm số lượng"
                  onClick={() => setCustomQuantity(Math.max(1, customQuantity - 1))}
                >
                  <IconMinus size={14} />
                </ActionIcon>
                <Text fw={800} style={{ minWidth: 28, textAlign: 'center' }}>
                  {customQuantity}
                </Text>
                <ActionIcon
                  size="md"
                  variant="default"
                  aria-label="Tăng số lượng"
                  disabled={customQuantity >= 99}
                  onClick={() => setCustomQuantity(customQuantity + 1)}
                >
                  <IconPlus size={14} />
                </ActionIcon>
              </Group>
            </Group>

            <Divider />

            <Stack gap="xs">
              <Button
                color="bamboo"
                size="md"
                fullWidth
                leftSection={<IconShoppingCartPlus size={20} />}
                disabled={selectedItem.available === false}
                onClick={handleAddToCartConfirm}
                style={{
                  backgroundColor: '#226135',
                  fontWeight: 700,
                  height: '46px',
                  fontSize: '1rem',
                  boxShadow: '0 4px 14px rgba(34, 97, 53, 0.3)',
                }}
              >
                {selectedItem.available === false ? 'Hết hàng' : `Thêm Vào Giỏ Hàng • ${formatPrice(selectedItem.price * customQuantity)}`}
              </Button>
            </Stack>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};
