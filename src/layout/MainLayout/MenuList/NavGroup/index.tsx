import React, { useEffect, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';

import Typography from '@mui/material/Typography';

// project imports
import NavCollapse from '../NavCollapse';
import NavItem from '../NavItem';

import { useGetMenuMaster } from 'api/menu';

// ==============================|| SIDEBAR MENU LIST GROUP ||============================== //


// Type definitions
interface MenuItem {
  id: string;
  type: string;
  title: string;
  caption?: string;
  url?: string;
  link?: string;
  icon?: React.ElementType;
  children?: MenuItem[];
}

interface NavGroupProps {
  item: MenuItem;
  lastItem?: number;
  remItems?: any[];
  lastItemId?: string;
  setSelectedID?: (id: string) => void;
}

const NavGroup: React.FC<NavGroupProps> = ({ item, lastItem, remItems = [], lastItemId, setSelectedID = () => {} }) => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened ?? false;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentItem, setCurrentItem] = useState<MenuItem>(item);
  const openMini = Boolean(anchorEl);

  useEffect(() => {
    if (lastItem) {
      if (item.id === lastItemId) {
        const localItem = { ...item };
        const elements = remItems.map((ele: any) => ele.elements);
        localItem.children = elements.flat(1);
        setCurrentItem(localItem);
      } else {
        setCurrentItem(item);
      }
    }
  }, [item, lastItem, remItems, lastItemId]);

  const checkOpenForParent = (child: MenuItem[], id: string) => {
    child.forEach((ele) => {
      if (ele.children?.length) {
        checkOpenForParent(ele.children, currentItem.id);
      }
      if (ele?.url && !!matchPath({ path: ele?.link ? ele.link : ele.url, end: true }, pathname)) {
        setSelectedID(id);
      }
    });
  };

  const checkSelectedOnload = (data: MenuItem) => {
    const childrens = data.children ? data.children : [];
    childrens.forEach((itemCheck) => {
      if (itemCheck?.children?.length) {
        checkOpenForParent(itemCheck.children, currentItem.id);
      }
      if (itemCheck?.url && !!matchPath({ path: itemCheck?.link ? itemCheck.link : itemCheck.url, end: true }, pathname)) {
        setSelectedID(currentItem.id);
      }
    });

    if (data?.url && !!matchPath({ path: data?.link ? data.link : data.url, end: true }, pathname)) {
      setSelectedID(currentItem.id);
    }
  };

  // keep selected-menu on page load and use for horizontal menu close on change routes
  useEffect(() => {
    checkSelectedOnload(currentItem);
    if (openMini) setAnchorEl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentItem]);

  // menu list collapse & items
  const items = currentItem.children?.map((menu) => {
    switch (menu?.type) {
      case 'collapse':
        return <NavCollapse key={menu.id} menu={menu} level={1} parentId={currentItem.id} />;
      case 'item':
        return <NavItem key={menu.id} item={menu} level={1} setSelectedID={setSelectedID} />;
      default:
        return (
          <Typography key={menu?.id} variant="h6" color="error" align="center">
            Menu Items Error
          </Typography>
        );
    }
  });

  return (
    <>
      <List
        disablePadding={!drawerOpen}
        subheader={
          currentItem.title &&
          drawerOpen && (
            <Typography variant="caption" gutterBottom sx={{ display: 'block', ...theme.typography.caption }}>
              {currentItem.title}
              {currentItem.caption && (
                <Typography variant="caption" gutterBottom sx={{ display: 'block', ...theme.typography.caption }}>
                  {currentItem.caption}
                </Typography>
              )}
            </Typography>
          )
        }
      >
        {items}
      </List>

      {/* group divider */}
      {drawerOpen && <Divider sx={{ mt: 0.25, mb: 1.25 }} />}
    </>
  );
}


export default NavGroup;
