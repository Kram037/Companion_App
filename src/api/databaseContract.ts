export const dbTables = {
  campaigns: 'campagne',
  users: 'utenti',
  characters: 'personaggi',
  campaignCharacters: 'personaggi_campagna',
  friendRequests: 'richieste_amicizia',
  sessions: 'sessioni',
  initiativeRequests: 'richieste_tiro_iniziativa',
  genericRollRequests: 'richieste_tiro_generico',
  combatMonsters: 'mostri_combattimento',
  combatTimers: 'combat_timers',
} as const;

export const homebrewTables = [
  'homebrew_background',
  'homebrew_classi',
  'homebrew_combattimenti',
  'homebrew_incantesimi',
  'homebrew_nemici',
  'homebrew_oggetti',
  'homebrew_razze',
  'homebrew_stili',
  'homebrew_suppliche',
  'homebrew_talenti',
] as const;

export type HomebrewTable = (typeof homebrewTables)[number];

export const dbRpc = {
  getCampaignDm: 'get_dm_campagna',
  getCampaignDms: 'get_dms_campagne',
  getCampaignPlayers: 'get_giocatori_campagna',
  getCampaignCharacters: 'get_personaggi_in_campagna',
  getReceivedCampaignInvites: 'get_inviti_ricevuti',
  acceptCampaignInvite: 'accetta_invito_campagna',
  rejectCampaignInvite: 'rifiuta_invito_campagna',
  getFriends: 'get_amici',
  getIncomingFriendRequests: 'get_richieste_in_entrata',
  getOutgoingFriendRequests: 'get_richieste_in_uscita',
  startCampaignSession: 'start_campaign_session',
  finishCampaignSession: 'finish_campaign_session',
  requestInitiativeRolls: 'request_initiative_rolls',
  requestGenericRolls: 'request_generic_rolls',
  getCombatMonsters: 'get_combat_monsters_safe',
  advanceCombatTurn: 'advance_combat_turn',
  finishCombat: 'finish_combat',
  getInitiativeRolls: 'get_tiri_iniziativa',
} as const;
