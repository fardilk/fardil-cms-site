import React, { useEffect, useRef, useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import useConfig from 'hooks/useConfig';

// assets
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';


// Type definitions
interface MenuItem {
  id: string;
  type: string;
  title: string;
  caption?: string;
  url?: string;
  link?: string;
  icon?: React.ElementType;
  chip?: {
    color: string;
    variant: string;
    size: string;
    label: string;
    avatar?: string;
  };
  target?: boolean;
  disabled?: boolean;
  children?: MenuItem[];
}

interface NavItemProps {
  item: MenuItem;
  level: number;
  isParents?: boolean;
  setSelectedID?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, level, isParents = false, setSelectedID }) => {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const ref = useRef<HTMLSpanElement>(null);
  const { pathname } = useLocation();
  const { borderRadius } = useConfig();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened ?? false;
  const itemPath = item?.link ?? item.url ?? '';
  const isSelected = !!(itemPath && matchPath({ path: itemPath, end: false }, pathname));
  const [hoverStatus, setHover] = useState(false);

  const compareSize = () => {
    const compare = !!(ref.current && ref.current.scrollWidth > ref.current.clientWidth);
    setHover(compare);
  };

  useEffect(() => {
    compareSize();
    window.addEventListener('resize', compareSize);
    return () => {
      window.removeEventListener('resize', compareSize);
    };
  }, []);

  const Icon = item?.icon;
  const itemIcon = Icon ? (
    <Icon stroke={1.5} size={drawerOpen ? '20px' : '24px'} style={{ ...(isParents && { fontSize: 20, stroke: '1.5' }) }} />
  ) : (
    <FiberManualRecordIcon sx={{ width: isSelected ? 8 : 6, height: isSelected ? 8 : 6 }} fontSize={level > 0 ? 'inherit' : 'medium'} />
  );

  let itemTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  const itemHandler = () => {
    if (downMD) handlerDrawerOpen(false);
    if (isParents && setSelectedID) {
      setSelectedID();
    }
  };

  const iconSelectedColor = 'secondary.main';

  return (
    <>
      <ListItemButton
        component={Link}
        to={item.url ?? ''}
        target={itemTarget}
        disabled={item.disabled}
        disableRipple={!drawerOpen}
        sx={{
          zIndex: 1201,
          borderRadius: `${borderRadius}px`,
          mb: 0.5,
          ...(drawerOpen && level !== 1 && { ml: `${level * 18}px` }),
          ...(!drawerOpen && { pl: 1.25 }),
          ...(drawerOpen &&
            level === 1 && {
              '&:hover': {
                bgcolor: 'secondary.light'
              },
              '&.Mui-selected': {
                bgcolor: 'secondary.light',
                color: iconSelectedColor,
                '&:hover': {
                  color: iconSelectedColor,
                  bgcolor: 'secondary.light'
                }
              }
            }),
          ...((!drawerOpen || level !== 1) && {
            py: level === 1 ? 0 : 1,
            '&:hover': {
              bgcolor: 'transparent'
            },
            '&.Mui-selected': {
              '&:hover': {
                bgcolor: 'transparent'
              },
              bgcolor: 'transparent'
            }
          })
        }}
        selected={isSelected}
        onClick={() => itemHandler()}
      >
        <ButtonBase aria-label="theme-icon" sx={{ borderRadius: `${borderRadius}px` }} disableRipple={drawerOpen}>
          <ListItemIcon
            sx={{
              minWidth: level === 1 ? 36 : 18,
              color: isSelected ? iconSelectedColor : 'text.primary',
              ...(!drawerOpen &&
                level === 1 && {
                  borderRadius: `${borderRadius}px`,
                  width: 46,
                  height: 46,
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: 'secondary.light'
                  },
                  ...(isSelected && {
                    bgcolor: 'secondary.light',
                    '&:hover': {
                      bgcolor: 'secondary.light'
                    }
                  })
                })
            }}
          >
            {itemIcon}
          </ListItemIcon>
        </ButtonBase>

        {(drawerOpen || (!drawerOpen && level !== 1)) && (
          <Tooltip title={item.title} disableHoverListener={!hoverStatus}>
            <ListItemText
              primary={
                <Typography
                  ref={ref}
                  noWrap
                  variant={isSelected ? 'h5' : 'body1'}
                  color="inherit"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: 102
                  }}
                >
                  {item.title}
                </Typography>
              }
              secondary={
                item.caption && (
                  <Typography variant="caption" gutterBottom className="block text-xs text-gray-500 dark:text-gray-400">
                    {item.caption}
                  </Typography>
                )
              }
            />
          </Tooltip>
        )}

        {drawerOpen && item.chip && (
          <Chip
            color={item.chip.color as any}
            variant={item.chip.variant as any}
            size={item.chip.size as any}
            label={item.chip.label}
            avatar={
              item.chip.avatar
                ? typeof item.chip.avatar === 'string'
                  ? <Avatar>{item.chip.avatar}</Avatar>
                  : item.chip.avatar
                : undefined
            }
          />
        )}
      </ListItemButton>
    </>
  );
};

export default NavItem;
