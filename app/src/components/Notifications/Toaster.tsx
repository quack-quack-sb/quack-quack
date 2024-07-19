import { Toaster as HotToaster } from 'react-hot-toast';
import * as styles from './Notifications.css';

export const Toaster = () => {
  return (
    <HotToaster
      containerClassName={styles.container}
      containerStyle={{ inset: 0 }}
    />
  );
};
