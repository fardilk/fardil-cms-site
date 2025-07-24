import React, { useState, ReactNode, ForwardedRef } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Popper from '@mui/material/Popper';
import Box from '@mui/material/Box';

// third party
import PopupState, { bindPopper, bindToggle } from 'material-ui-popup-state';
import { IconAdjustmentsHorizontal, IconSearch, IconX } from '@tabler/icons-react';

// project imports
import Transitions from 'ui-component/extended/Transitions';

// assets



interface HeaderAvatarProps {
  children: ReactNode;
  // Accept any other props (e.g., from Avatar)
  [key: string]: any;
}

// Forward ref for Avatar
const HeaderAvatar = React.forwardRef<HTMLElement, HeaderAvatarProps>(
  ({ children, ...others }, ref) => {
    return (
      <Avatar
        ref={ref as ForwardedRef<any>}
        variant="rounded"
        sx={{
          bgcolor: 'secondary.light',
          color: 'secondary.dark',
          '&:hover': {
            bgcolor: 'secondary.dark',
            color: 'secondary.light'
          }
        }}
        className="w-9 h-9 text-base" // Tailwind: width/height 36px, font size
        {...others}
      >
        {children}
      </Avatar>
    );
  }
);
HeaderAvatar.displayName = 'HeaderAvatar';



// TypeScript interface for MobileSearch props
interface MobileSearchProps {
  value: string;
  setValue: (val: string) => void;
  popupState: any; // No TS type exported from material-ui-popup-state
}

const MobileSearch: React.FC<MobileSearchProps> = ({ value, setValue, popupState }) => {
  return (
    <OutlinedInput
      id="input-search-header"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search"
      startAdornment={
        <InputAdornment position="start">
          <IconSearch stroke={1.5} size="16px" />
        </InputAdornment>
      }
      endAdornment={
        <InputAdornment position="end">
          <HeaderAvatar>
            <IconAdjustmentsHorizontal stroke={1.5} size="20px" />
          </HeaderAvatar>
          <Box sx={{ ml: 2 }}>
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: 'orange.light',
                color: 'orange.dark',
                '&:hover': {
                  bgcolor: 'orange.dark',
                  color: 'orange.light'
                }
              }}
              className="w-9 h-9 text-base" // Tailwind: width/height 36px, font size
              {...bindToggle(popupState)}
            >
              <IconX stroke={1.5} size="20px" />
            </Avatar>
          </Box>
        </InputAdornment>
      }
      aria-describedby="search-helper-text"
      slotProps={{ input: { 'aria-label': 'weight', sx: { bgcolor: 'transparent', pl: 0.5 } } }}
      sx={{ width: '100%', ml: 0.5, px: 2, bgcolor: 'background.paper' }}
      className="w-full ml-1 px-2 bg-white dark:bg-gray-900"
    />
  );
};


const SearchSection: React.FC = () => {
  const [value, setValue] = useState<string>('');

  return (
    <>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <PopupState variant="popper" popupId="demo-popup-popper">
          {(popupState: any) => (
            <>
              <Box sx={{ ml: 2 }}>
                <HeaderAvatar {...bindToggle(popupState)}>
                  <IconSearch stroke={1.5} size="19.2px" />
                </HeaderAvatar>
              </Box>
              <Popper
                open={popupState.isOpen}
                transition
                sx={{ zIndex: 1100, width: '99%', top: '-55px !important', px: { xs: 1.25, sm: 1.5 } }}
              >
                {({ TransitionProps }: any) => (
                  <Transitions type="zoom" {...TransitionProps} sx={{ transformOrigin: 'center left' }}>
                    <Card sx={{ bgcolor: 'background.default', border: 0, boxShadow: 'none' }}>
                      <Box sx={{ p: 2 }}>
                        <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <Grid>
                            <MobileSearch value={value} setValue={setValue} popupState={popupState} />
                          </Grid>
                        </Grid>
                      </Box>
                    </Card>
                  </Transitions>
                )}
              </Popper>
            </>
          )}
        </PopupState>
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <OutlinedInput
          id="input-search-header"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search"
          startAdornment={
            <InputAdornment position="start">
              <IconSearch stroke={1.5} size="16px" />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <HeaderAvatar>
                <IconAdjustmentsHorizontal stroke={1.5} size="20px" />
              </HeaderAvatar>
            </InputAdornment>
          }
          aria-describedby="search-helper-text"
          slotProps={{ input: { 'aria-label': 'weight', sx: { bgcolor: 'transparent', pl: 0.5 } } }}
          sx={{ width: { md: 250, lg: 434 }, ml: 2, px: 2 }}
          className="md:w-[250px] lg:w-[434px] ml-2 px-2" // Tailwind for width, margin, padding
        />
      </Box>
    </>
  );
};

export default SearchSection;


