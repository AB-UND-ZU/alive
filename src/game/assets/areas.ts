export const menuArea = `\
#######################
#                     #
# A:\\>alive.exe       #
#                     #
#  █▀▄ █   █ █ █ ▄▀▀  #
#  █▄█ █   █ █ █ █▄▄  #
#  █ █ ▀▄▄ █ █▄▀ █▄▄  #
#                     #
#                     #
#                     #
${
  window.matchMedia("(pointer: coarse)").matches
    ? "#    swipe to move    #"
    : "#   \u011a \u0117 \u0118 \u0119 to move   #"
}
#                     #
#   /      ¢      ╒   #
#                     #
###########◙###########
##########   ##########
#########     #########\
`;

/*
█    pick up sword    █
█    destroy chest    █
█    collect a key    █
█    open the door    █
█    equip compass    █
█    set character    █
*/
