import { forwardRef, useImperativeHandle } from 'react';
import { FormProvider } from 'react-hook-form';
import { View } from 'react-native';
import { normalizeCategoryInput } from '@/lib/categories';
import { Password } from '@/store/passwordStore';
import { FieldCategory } from './field-category';
import { FieldIcon } from './field-icon';
import { FieldNotes } from './field-notes';
import { FieldPassword } from './field-password';
import { FieldTitle } from './field-title';
import { FieldTotp } from './field-totp';
import { FieldUrl } from './field-url';
import { FieldUsername } from './field-username';
import { defaultValues, FormType } from './form';
import { useValidatedForm } from './form';

export interface PasswordFormRef {
  requestSubmit: () => void;
}

export * from './form';

interface PasswordFormProps {
  initialValue?: Partial<FormType>;
  onSubmit?: (data: Omit<Password, 'id' | 'created_at' | 'updated_at'>) => void;
}

export const PasswordForm = forwardRef<PasswordFormRef, PasswordFormProps>(
  (props, ref) => {
    const { initialValue, onSubmit } = props;

    const form = useValidatedForm({
      defaultValues: {
        ...defaultValues,
        ...initialValue,
      },
      mode: 'onChange',
    });

    useImperativeHandle(ref, () => ({
      requestSubmit: () => {
        form
          .handleSubmit(
            data => {
              const { totpSecret, ...rest } = data;
              onSubmit?.({
                ...rest,
                category: normalizeCategoryInput(data.category),
                icon: data.icon ?? null,
                url: data.url ?? null,
                notes: data.notes ?? null,
                totp_secret: totpSecret ? totpSecret.trim() : null,
              });
            },
            errors => {
              console.error('validation errors', errors);
            }
          )()
          .catch(console.error);
      },
    }));

    return (
      <FormProvider {...form}>
        <View style={{ gap: 16 }}>
          <FieldIcon />
          <FieldTitle />
          <FieldUsername />
          <FieldPassword />
          <FieldUrl />
          <FieldTotp />
          <FieldCategory />
          <FieldNotes />
        </View>
      </FormProvider>
    );
  }
);
