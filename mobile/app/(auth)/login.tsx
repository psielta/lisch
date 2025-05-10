import { useState, useContext } from "react";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Keyboard } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import { AlertCircleIcon } from "@/components/ui/icon";
import { useToast, Toast, ToastTitle } from "@/components/ui/toast";
import { AuthContext } from "@/context/AuthContext";
import { Image } from "react-native";

const schema = z.object({
  email: z.string().email('E‑mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginSchemaType = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(schema),
  });

  const { signIn, signInLoading } = useContext(AuthContext);

  const handleLogin = async (data: LoginSchemaType) => {
    try {
      console.log("Login data:", data);

      await signIn(data.email, data.password);

      toast.show({
        placement: "bottom right",
        duration: 1000,
        render: ({ id }: { id: string }) => (
          <Toast nativeID={id} variant="solid" action="success">
            <ToastTitle>Login realizado com sucesso!</ToastTitle>
          </Toast>
        ),
      });

      router.replace("/(app)/home");
    } catch (error) {
      toast.show({
        placement: "bottom right",
        duration: 1000,
        render: ({ id }: { id: string }) => (
          <Toast nativeID={id} variant="solid" action="error">
            <ToastTitle>Usuário ou senha inválidos</ToastTitle>
          </Toast>
        ),
      });
    }
  };

  const handleKeyPress = () => {
    Keyboard.dismiss();
    handleSubmit(handleLogin)();
  };

  return (
    <View className="flex-1 justify-center px-4">
      <VStack space="lg" className="w-full">
        <Image 
          source={require("@/assets/images/logo.png")}
          style={{ width: 120, height: 120, alignSelf: 'center' }}
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold text-center">Bem-vindo</Text>
        <Text className="text-center text-gray-500">
          Faça login para continuar
        </Text>

        <FormControl isInvalid={!!errors.email}>
          <FormControlLabel>
            <FormControlLabelText>Email</FormControlLabelText>
          </FormControlLabel>
          <Controller
            name="email"
            control={control}
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  placeholder="email"
                  keyboardType="default"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onSubmitEditing={handleKeyPress}
                />
              </Input>
            )}
          />
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>
              {errors.email?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!errors.password}>
          <FormControlLabel>
            <FormControlLabelText>Senha</FormControlLabelText>
          </FormControlLabel>
          <Controller
            name="password"
            control={control}
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={value}
                  onChangeText={onChange}
                  onSubmitEditing={handleKeyPress}
                />
                <InputSlot onPress={() => setShowPassword(!showPassword)}>
                  <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
                </InputSlot>
              </Input>
            )}
          />
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>
              {errors.password?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <Button onPress={handleSubmit(handleLogin)} disabled={signInLoading}>
          <ButtonText>
            {signInLoading ? "Entrando..." : "Entrar"}
          </ButtonText>
        </Button>
      </VStack>
    </View>
  );
}
