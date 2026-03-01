"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth.api"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(values.email, values.password)
      
      if (response.success) {
        setAuth(response.data.user, response.data.accessToken, response.data.refreshToken)
        
        // Redirect based on role
        const roleRoutes = {
          admin: "/admin/dashboard",
          faculty: "/faculty/dashboard",
          student: "/student/dashboard",
        }
        
        router.push(roleRoutes[response.data.user.role])
        toast.success("Login successful!")
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed. Please try again."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-2xl font-bold text-slate-900">
              N
            </div>
            <div>
              <h1 className="text-2xl font-bold">NBAC</h1>
              <p className="text-slate-400 text-sm">National Board of Accreditation Companion</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Streamline Your NBA Accreditation Journey
          </h2>
          <p className="text-lg text-slate-300">
            Automate OBE data management, track CO-PO attainment, and generate 
            NBA-compliant reports with ease.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-amber-500">CO-PO</div>
              <p className="text-sm text-slate-400 mt-1">Matrix Mapping</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-amber-500">Auto</div>
              <p className="text-sm text-slate-400 mt-1">Attainment Calculation</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-amber-500">NBA</div>
              <p className="text-sm text-slate-400 mt-1">Compliant Reports</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-amber-500">Real-time</div>
              <p className="text-sm text-slate-400 mt-1">Analytics Dashboard</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          © 2024 NBAC. Built for Engineering Excellence.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-900">
                N
              </div>
              <span className="font-semibold text-xl">NBAC</span>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="h-11 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-11 w-11"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-center text-slate-500">
                Don&apos;t have an account? Contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
