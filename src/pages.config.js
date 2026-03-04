/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AgentChat from './pages/AgentChat';
import AgentDiagnostics from './pages/AgentDiagnostics';
import Analytics from './pages/Analytics';
import BuyerCRM from './pages/BuyerCRM';
import Buyers from './pages/Buyers';
import ComparableAnalysis from './pages/ComparableAnalysis';
import CraigslistLeads from './pages/CraigslistLeads';
import Dashboard from './pages/Dashboard';
import DataIntegrations from './pages/DataIntegrations';
import DealAnalysis from './pages/DealAnalysis';
import Home from './pages/Home';
import LeadsPipeline from './pages/LeadsPipeline';
import MarketAnalysis from './pages/MarketAnalysis';
import MyCriteria from './pages/MyCriteria';
import OutreachStatus from './pages/OutreachStatus';
import PropertySearch from './pages/PropertySearch';
import Settings from './pages/Settings';
import SmartMAOCalculator from './pages/SmartMAOCalculator';
import DealFlowDashboard from './pages/DealFlowDashboard';
import LeadSearch from './pages/LeadSearch';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentChat": AgentChat,
    "AgentDiagnostics": AgentDiagnostics,
    "Analytics": Analytics,
    "BuyerCRM": BuyerCRM,
    "Buyers": Buyers,
    "ComparableAnalysis": ComparableAnalysis,
    "CraigslistLeads": CraigslistLeads,
    "Dashboard": Dashboard,
    "DataIntegrations": DataIntegrations,
    "DealAnalysis": DealAnalysis,
    "Home": Home,
    "LeadsPipeline": LeadsPipeline,
    "MarketAnalysis": MarketAnalysis,
    "MyCriteria": MyCriteria,
    "OutreachStatus": OutreachStatus,
    "PropertySearch": PropertySearch,
    "Settings": Settings,
    "SmartMAOCalculator": SmartMAOCalculator,
    "DealFlowDashboard": DealFlowDashboard,
    "LeadSearch": LeadSearch,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};