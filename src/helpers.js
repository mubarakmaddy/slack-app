export const buildPutWorkspaceParams = ({ tenantId, installation }) => {
  const teamId = installation.team.id;
  if (!teamId) {
    throw new Error('Not support Org installation!');
  }
  return {
    teamId,
    tenantId,
    name: installation.team.name,
    appId: installation.appId || '',
    botId: installation.bot.id || '',
    botUserId: installation.bot.userId || '',
    token: installation.bot.token || '',
    scopes: installation.bot.scopes || [],
  };
};

export const buildSlackInstallation = (workspace) => {
  return {
    team: { id: workspace.teamId, name: workspace.name },
    enterprise: undefined,
    appId: workspace.appId,
    user: { id: '', token: '', scopes: [] },
    bot: {
      scopes: workspace.scopes,
      token: workspace.token,
      userId: workspace.botUserId,
      id: workspace.botId,
    },
    tokenType: 'bot',
  };
};
