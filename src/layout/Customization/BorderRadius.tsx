// material-ui
import Grid from '@mui/material/Grid';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import useConfig from 'hooks/useConfig';

// concat 'px'
function valueText(value: number) {
  return `${value}px`;
}



type Config = {
  borderRadius: number;
  onChangeBorderRadius: (event: Event, newValue: number) => void;
};

export default function BorderRadius() {
  const { borderRadius, onChangeBorderRadius } = useConfig() as Config;

  return (
    <Stack spacing={2.5} className="pl-4 pb-4 pr-8">
      <Typography variant="h5">BORDER RADIUS</Typography>
      <Grid container spacing={1.25} className="pt-2 items-center justify-center">
        <Grid>
          <Typography variant="h6">4px</Typography>
        </Grid>
        <Grid>
          <Slider
            size="small"
            value={borderRadius}
            onChange={onChangeBorderRadius}
            getAriaValueText={valueText}
            valueLabelDisplay="on"
            aria-labelledby="discrete-slider-small-steps"
            min={4}
            max={24}
            color="primary"
            sx={{
              '& .MuiSlider-valueLabel': {
                color: 'primary.light'
              }
            }}
          />
        </Grid>
        <Grid>
          <Typography variant="h6">24px</Typography>
        </Grid>
      </Grid>
    </Stack>
  );
}
