import { getSupabaseAdmin } from './supabase-admin';

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: object = {}
) {
  if (!pushToken || (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken['))) {
    return;
  }

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      }),
    });

    const result = await res.json();
    return result;
  } catch (err) {
    console.error('Error sending Expo push notification:', err);
  }
}

export async function notifyUserByProfileId(
  profileId: string,
  title: string,
  body: string,
  data: object = {}
) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', profileId)
      .single();

    if (profile?.push_token) {
      await sendPushNotification(profile.push_token, title, body, data);
    }
  } catch (err) {
    console.error('Error sending user push notification:', err);
  }
}
