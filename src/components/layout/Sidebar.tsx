import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  ShoppingCart,
  Beaker,
  AlertTriangle,
  Settings,
  FileText,
  BookOpen,
  Microscope,
  MapPin,
  Box,
  LogOut,
  Package,
  ClipboardList,
  Play,
  History,
  GitBranch,
  FileSpreadsheet,
  Tag
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  { name: 'Главная', href: '/', icon: LayoutDashboard },
  { name: 'Культуры', href: '/cultures', icon: FlaskConical },
  { name: 'Доноры', href: '/donors', icon: Users },
  { name: 'Заказы', href: '/orders', icon: ShoppingCart },
  { name: 'Среды', href: '/media', icon: Beaker },
  { name: 'Инвентарь', href: '/inventory', icon: Package },
  { name: 'Рецепты сред', href: '/media-recipes', icon: ClipboardList },
  { name: 'Отклонения', href: '/deviations', icon: AlertTriangle },
  { name: 'QC Тесты', href: '/qc-tests', icon: Microscope },
  { name: 'Задачи', href: '/tasks', icon: ClipboardList },
  { name: 'Выдачи', href: '/releases', icon: Package },
  { name: 'Отчёты', href: '/reports', icon: FileSpreadsheet },
  { name: 'Этикетки', href: '/labels', icon: Tag },
]

const references = [
  { name: 'Оборудование', href: '/equipment', icon: Microscope },
  { name: 'Локации', href: '/locations', icon: MapPin },
  { name: 'Типы контейнеров', href: '/container-types', icon: Box },
  { name: 'СОПы', href: '/sops', icon: BookOpen },
]

const admin = [
  { name: 'Шаблоны процессов', href: '/process-templates', icon: FileText },
  { name: 'Пользователи', href: '/users', icon: Users },
  { name: 'Журнал изменений', href: '/audit-log', icon: History },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const { signOut } = useAuth()
  
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-emerald-400" />
          BMCP Platform
        </h1>
        <p className="text-xs text-slate-400 mt-1">Управление клеточными культурами</p>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Основное
          </h2>
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Справочники
          </h2>
          <ul className="space-y-1">
            {references.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Администрирование
          </h2>
          <ul className="space-y-1">
            {admin.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
        <div className="mt-3 text-center text-xs text-slate-500">
          v0.1.1
        </div>
      </div>
    </aside>
  )
}
