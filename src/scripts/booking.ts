import EmbedSnippet from '@calcom/embed-snippet';

const container = document.querySelector<HTMLElement>('[data-cal-booking]');
const host = container?.querySelector<HTMLElement>('[data-cal-host]');
const status = container?.querySelector<HTMLElement>('[data-cal-status]');

if (container && host && status && container.dataset.calLink && container.dataset.calNamespace) {
  const namespace = container.dataset.calNamespace;
  const calLink = container.dataset.calLink;
  let timeout: ReturnType<typeof setTimeout>;

  const showFailure = () => {
    clearTimeout(timeout);
    host.hidden = true;
    host.setAttribute('aria-busy', 'false');
    status.hidden = false;
    status.textContent = 'The calendar couldn’t load here. Use “Open in Cal.com” above to choose a time.';
  };

  const showReady = () => {
    clearTimeout(timeout);
    host.hidden = false;
    host.setAttribute('aria-busy', 'false');
    status.hidden = true;
  };

  // Handles a blocked embed script or a stalled network, as well as provider errors.
  // The direct booking link remains available regardless of JavaScript or iframe state.
  timeout = setTimeout(showFailure, 15000);
  try {
    const Cal = EmbedSnippet();
    // Match the host in Cal.com's generated embed snippet. The public cal.com
    // share URL redirects to app.cal.com; iframe messages come from that origin.
    Cal('init', namespace, { origin: 'https://app.cal.com' });
    const calendar = Cal.ns[namespace];
    calendar('on', { action: 'linkReady', callback: showReady });
    calendar('on', { action: 'linkFailed', callback: showFailure });
    calendar('inline', { elementOrSelector: host, calLink, config: { layout: 'month_view', theme: 'light', useSlotsViewOnSmallScreen: 'true' } });
    calendar('ui', {
      theme: 'light',
      layout: 'month_view',
      hideEventTypeDetails: false,
      cssVarsPerTheme: {
        light: { 'cal-brand': '#172327', 'cal-brand-emphasis': '#2855d9', 'cal-brand-text': '#ffffff' },
        dark: { 'cal-brand': '#f7f6f2', 'cal-brand-text': '#172327' },
      },
    });
    // Cal.com owns payment and confirmation. An iframe event is not proof of payment;
    // do not create a local "paid" or "confirmed" state from a client-side message.
  } catch {
    showFailure();
  }
}
