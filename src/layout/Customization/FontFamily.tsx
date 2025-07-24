// material-ui
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import useConfig from 'hooks/useConfig';
// @ts-ignore
import MainCard from 'ui-component/cards/MainCard';

// ==============================|| CUSTOMIZATION - FONT FAMILY ||============================== //

const FontFamily = () => {
  type Config = {
    fontFamily: string;
    onChangeFontFamily: (fontFamily: string) => void;
  };
  const { fontFamily, onChangeFontFamily } = useConfig() as unknown as Config;

  const handleFontChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFontFamily(event.target.value);
  };

  const fonts = [
    {
      id: 'inter',
      value: `'Inter', sans-serif`,
      label: 'Inter'
    },
    {
      id: 'poppins',
      value: `'Poppins', sans-serif`,
      label: 'Poppins'
    },
    {
      id: 'roboto',
      value: `'Roboto', sans-serif`,
      label: 'Roboto'
    }
  ];

  const bgColor = 'grey.50';
  const bgActiveColor = 'primary.light';

  return (
    <Stack spacing={2.5} sx={{ p: 2, width: '100%' }}>
      <Typography variant="h5">FONT STYLE</Typography>
      <RadioGroup aria-label="payment-card" name="payment-card" value={fontFamily} onChange={handleFontChange}>
        <Grid container spacing={1.25}>
          {fonts.map((item, index) => (
            <Grid key={index} className="w-full">
              <MainCard
                content={false}
                boxShadow={undefined}
                darkTitle={undefined}
                secondary={undefined}
                shadow={undefined}
                ref={undefined}
                sx={{ p: 0.75, bgcolor: fontFamily === item.value ? bgActiveColor : bgColor }}
                title={undefined}
              >
                <MainCard
                  content={false}
                  border
                  boxShadow={undefined}
                  darkTitle={undefined}
                  secondary={undefined}
                  shadow={undefined}
                  ref={undefined}
                  sx={{
                    p: 1.75,
                    borderWidth: 1,
                    ...(fontFamily === item.value && { borderColor: 'primary.main' })
                  }}
                  title={undefined}
                >
                  <FormControlLabel
                    sx={{ width: 1 }}
                    control={<Radio value={item.value} sx={{ display: 'none' }} />}
                    label={
                      <Typography variant="h5" sx={{ pl: 2, fontFamily: item.value }}>
                        {item.label}
                      </Typography>
                    }
                  />
                </MainCard>
              </MainCard>
            </Grid>
          ))}
        </Grid>
      </RadioGroup>
    </Stack>
  );
};

export default FontFamily;
