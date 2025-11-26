import Dashboard from './pages/Dashboard';
import DealAnalysis from './pages/DealAnalysis';
import Buyers from './pages/Buyers';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import DataIntegrations from './pages/DataIntegrations';
import PropertySearch from './pages/PropertySearch';
import MyCriteria from './pages/MyCriteria';
import LeadsPipeline from './pages/LeadsPipeline';
import OutreachStatus from './pages/OutreachStatus';
import BuyerCRM from './pages/BuyerCRM';
import ComparableAnalysis from './pages/ComparableAnalysis';
import SmartMAOCalculator from './pages/SmartMAOCalculator';
import CraigslistLeads from './pages/CraigslistLeads';
import AgentChat from './pages/AgentChat';
import AgentDiagnostics from './pages/AgentDiagnostics';
import MarketAnalysis from './pages/MarketAnalysis';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "DealAnalysis": DealAnalysis,
    "Buyers": Buyers,
    "Analytics": Analytics,
    "Settings": Settings,
    "DataIntegrations": DataIntegrations,
    "PropertySearch": PropertySearch,
    "MyCriteria": MyCriteria,
    "LeadsPipeline": LeadsPipeline,
    "OutreachStatus": OutreachStatus,
    "BuyerCRM": BuyerCRM,
    "ComparableAnalysis": ComparableAnalysis,
    "SmartMAOCalculator": SmartMAOCalculator,
    "CraigslistLeads": CraigslistLeads,
    "AgentChat": AgentChat,
    "AgentDiagnostics": AgentDiagnostics,
    "MarketAnalysis": MarketAnalysis,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};