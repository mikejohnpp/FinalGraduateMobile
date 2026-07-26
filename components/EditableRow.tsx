// EditableRow — port từ web (src/components/profile/EditableRow.tsx).
// Mỗi hàng có 2 trạng thái: xem (bấm để sửa) và đang sửa (input + Hủy/Lưu).
// Khi một hàng khác đang sửa thì hàng này bị "khoá" (isLocked) — giống web.
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useTheme';

export interface EditableRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  placeholder: string;
  field: string;
  isActive: boolean;
  isLocked: boolean;
  onEdit: (field: string) => void;
  onSave: (field: string, value: string) => void;
  onCancel: () => void;
  /** Bàn phím số cho các trường như ngày sinh. */
  keyboardType?: 'default' | 'numeric';
}

export function EditableRow({
  icon,
  label,
  value,
  placeholder,
  field,
  isActive,
  isLocked,
  onEdit,
  onSave,
  onCancel,
  keyboardType = 'default',
}: EditableRowProps) {
  const colors = useThemeColors();
  const [localValue, setLocalValue] = React.useState(value ?? '');
  const [wasActive, setWasActive] = React.useState(isActive);

  // Reset localValue từ value mỗi khi hàng chuyển sang chế độ sửa.
  // Pattern "điều chỉnh state khi render" của React, tránh lệch giá trị mà không cần useEffect.
  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (isActive) {
      setLocalValue(value ?? '');
    }
  }

  if (isActive) {
    return (
      <View className="gap-2 rounded-md border border-border bg-muted/30 p-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name={icon} size={18} color={colors.mutedForeground} />
          <Text variant="small" className="text-muted-foreground">
            {label}
          </Text>
        </View>
        <TextInput
          className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground"
          value={localValue}
          onChangeText={setLocalValue}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          autoFocus
        />
        <View className="mt-1 flex-row justify-end gap-2">
          <Button size="sm" variant="secondary" onPress={onCancel}>
            <Text className="text-xs">Hủy</Text>
          </Button>
          <Button size="sm" onPress={() => onSave(field, localValue)}>
            <Text className="text-xs text-primary-foreground">Lưu</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chỉnh sửa ${label}`}
      accessibilityState={{ disabled: isLocked }}
      disabled={isLocked}
      onPress={() => onEdit(field)}
      className={`flex-row items-center gap-2 rounded-md p-3 ${
        isLocked ? 'opacity-50' : 'active:bg-muted'
      }`}>
      <Ionicons name={icon} size={18} color={colors.mutedForeground} />
      <Text className="text-muted-foreground">{label}</Text>
      {value ? (
        <Text className="flex-1 font-semibold" numberOfLines={1}>
          {value}
        </Text>
      ) : (
        <Text className="flex-1 text-muted-foreground/60" numberOfLines={1}>
          {placeholder}
        </Text>
      )}
    </Pressable>
  );
}
