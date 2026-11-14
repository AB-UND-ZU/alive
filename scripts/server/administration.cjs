const normalize = (value) => value?.toLowerCase();
const validUsername = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_][A-Za-z0-9_-]{0,15}$/.test(value);
exports.validUsername = validUsername;

exports.createAdministration = ({
  accounts,
  clients,
  adminIds,
  simulation,
  save,
  restart,
  onPlayer,
}) => {
  const startup = new Set(adminIds);
  let admins = new Set(startup);
  const pending = new Map();
  let processing = false,
    epoch = 0;
  const online = (id) =>
    [...clients.entries()].some(
      ([socket, client]) => socket.readyState === 1 && client.account?.id === id
    );
  const roster = () =>
    [...accounts.values()].map((account) => ({
      id: account.id,
      username: account.username,
      status: account.banned
        ? "banned"
        : online(account.id)
        ? "online"
        : "offline",
      admin: !account.banned && admins.has(account.id),
    }));
  const sync = () => {
    const host = simulation();
    const players = roster();
    host.roster(players);
    for (const player of players)
      host.identify(player.id, player.username, player.admin);
  };
  const kick = (id) => {
    simulation().disconnect(id);
    for (const [socket, client] of clients)
      if (client.account?.id === id || client.claimingId === id) {
        client.account = undefined;
        client.claimingId = undefined;
        socket.close(1008, "Disconnected by server");
      }
  };
  const choose = (id, username) => {
    const account = accounts.get(id);
    if (!account || account.banned) return "Session unavailable!";
    if (account.username) return;
    if (!validUsername(username)) return "Use 1-16 letters, digits, _ or -.";
    if (
      [...accounts.values()].some(
        (other) =>
          other.id !== id && normalize(other.username) === normalize(username)
      )
    )
      return "Name already used!";
    account.username = username;
    sync();
    simulation().named(id);
    onPlayer?.(account);
    void save().catch((error) =>
      console.error("Saving username failed:", error)
    );
  };
  const execute = async (id, args) => {
    if (!admins.has(id) || accounts.get(id)?.banned || !online(id)) return;
    const [action, name, mode] = args;
    const reply = (lines) => {
      if (online(id)) simulation().reply(id, lines);
    };
    const list = (players) =>
      reply(
        players.length
          ? players.flatMap((player) => [
              player.username || "Unnamed",
              player.id,
              player.status + (player.admin ? " admin" : ""),
              "",
            ])
          : ["No players."]
      );
    if (action === "players" && args.length <= 2) {
      if (name && !["online", "offline", "banned"].includes(name))
        return reply(["Use online, offline or banned."]);
      return list(roster().filter((player) => !name || player.status === name));
    }
    if (["ban", "unban", "admin"].includes(action) && !name) {
      if (args.length !== 1) return reply(["Invalid arguments."]);
      return list(
        action === "admin"
          ? [...admins]
              .filter((id) => !accounts.get(id)?.banned)
              .map(
                (id) =>
                  roster().find((player) => player.id === id) || {
                    id,
                    status: "offline",
                    admin: true,
                  }
              )
          : roster().filter((player) => player.status === "banned")
      );
    }
    if (action === "restart" && args.length === 1) return restart();
    if (action === "kickall" && args.length === 1) {
      for (const player of roster())
        if (player.status === "online") kick(player.id);
      sync();
      return;
    }
    const account = [...accounts.values()].find(
      (player) => name && normalize(player.username) === normalize(name)
    );
    if (!account) return reply(["No such player."]);
    if (action === "admin" && args.length <= 3) {
      if (mode && !["on", "off"].includes(mode))
        return reply(["Use on or off."]);
      if (account.banned) return reply(["Player is banned."]);
      const enabled = mode ? mode === "on" : !admins.has(account.id);
      if (enabled) admins.add(account.id);
      else admins.delete(account.id);
      sync();
      return reply([account.username, enabled ? "Admin on." : "Admin off."]);
    }
    if (args.length !== 2) return reply(["Invalid arguments."]);
    if (action === "kick") {
      kick(account.id);
      sync();
      return reply([account.username, "Kicked."]);
    }
    if (action === "ban") {
      account.banned = true;
      account.reset = true;
      admins.delete(account.id);
      kick(account.id);
      simulation().forget(account.id);
    } else if (action === "unban") {
      account.banned = false;
    } else return reply(["Unknown server action."]);
    sync();
    await save();
    reply([account.username, action === "ban" ? "Banned." : "Unbanned."]);
  };
  return {
    sync,
    choose,
    isAdmin: (id) => admins.has(id) && !accounts.get(id)?.banned,
    reset() {
      epoch++;
      admins = new Set(startup);
      pending.clear();
      sync();
    },
    command(id, args) {
      if (!admins.has(id) || accounts.get(id)?.banned)
        return "Commands disabled!";
      if (!args.length)
        return "Use /server players, kick, kickall, ban, unban, restart or admin.";
      if (!pending.has(id)) pending.set(id, [...args]);
    },
    async flush() {
      if (processing || !pending.size) return;
      processing = true;
      const generation = epoch;
      try {
        for (const [id, args] of [...pending]) {
          if (epoch !== generation) break;
          pending.delete(id);
          try {
            await execute(id, args);
          } catch (error) {
            console.error("Server administration failed:", error);
            simulation().reply(id, ["Server action failed."]);
          }
        }
      } finally {
        processing = false;
      }
    },
  };
};

exports.parseAdmins = (args) => {
  const ids = [];
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    const value =
      flag === "--admins"
        ? args[++index]
        : flag.startsWith("--admins=")
        ? flag.slice(9)
        : undefined;
    if (!value || value.startsWith("--"))
      throw new Error("Use --admins <player-id,player-id>");
    for (const id of value.split(",")) {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        )
      )
        throw new Error("Invalid admin player ID: " + id);
      ids.push(id.toLowerCase());
    }
  }
  return [...new Set(ids)];
};
