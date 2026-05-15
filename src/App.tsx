import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from './layouts/MainLayout'
import Shows from './pages/Shows'
import ShowDetail from './pages/ShowDetail'
import ShowEdit from './pages/ShowEdit'
import Musicals from './pages/Musicals'
import MusicalDetail from './pages/MusicalDetail'
import MusicalEdit from './pages/MusicalEdit'
import Artists from './pages/Artists'
import ArtistDetail from './pages/ArtistDetail'
import ArtistEdit from './pages/ArtistEdit'
import ToastContainer from './components/Toast'
import ScrollToTop from './components/ScrollToTop'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Shows />} />
            <Route path="shows/:id" element={<ShowDetail />} />
            <Route path="shows/:id/edit" element={<ShowEdit />} />
            <Route path="shows/new" element={<ShowEdit />} />
            <Route path="musicals" element={<Musicals />} />
            <Route path="musicals/:id" element={<MusicalDetail />} />
            <Route path="musicals/:id/edit" element={<MusicalEdit />} />
            <Route path="musicals/new" element={<MusicalEdit />} />
            <Route path="artists" element={<Artists />} />
            <Route path="artists/:id" element={<ArtistDetail />} />
            <Route path="artists/:id/edit" element={<ArtistEdit />} />
            <Route path="artists/new" element={<ArtistEdit />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </ConfigProvider>
  )
}

export default App
