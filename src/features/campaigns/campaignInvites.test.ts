import { describe, expect, it } from 'vitest';

import { mapReceivedCampaignInviteRow } from '../../api';

describe('mapReceivedCampaignInviteRow', () => {
  it('maps the Supabase RPC row shape used by the legacy app', () => {
    expect(mapReceivedCampaignInviteRow({
      id: 'inv-1',
      campagna_id: 'camp-1',
      inviante_id: 'dm-1',
      invitato_id: 'user-1',
      stato: 'pending',
      campagna_nome_campagna: 'Alba Rossa',
      inviante_nome_utente: 'Kram',
      inviante_cid: '1234',
    })).toMatchObject({
      id: 'inv-1',
      campagna_id: 'camp-1',
      campagna: { id: 'camp-1', nome_campagna: 'Alba Rossa' },
      inviante: { id: 'dm-1', nome_utente: 'Kram', cid: '1234' },
    });
  });
});
