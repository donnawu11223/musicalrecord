import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from './layouts/MainLayout'
import Shows from './pages/Shows'
import Musicals from './pages/Musicals'
import Artists from './pages/Artists'
import Calendar from './pages/Calendar'
import Stats from './pages/Stats'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Shows />} />
            <Route path="musicals" element={<Musicals />} />
            <Route path="artists" element={<Artists />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="stats" element={<Stats />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
