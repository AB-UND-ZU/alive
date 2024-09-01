import { isTouch } from "../../components/Dimensions";

export const menuArea = `\
#######################
#                     #
#  █▀▄ █   █ █ █ ▄▀▀  #
#  █▄█ █   █ █ █ █▄▄  #
#  █ █ ▀▄▄ █ █▄▀ █▄▄  #
#                     #
${
  isTouch
    ? "#    swipe to move    #"
    : "#   \u011a \u0117 \u0118 \u0119 to move   #"
}
#                     #
#                     #
#                     #
#                     #
#     /    ¢    ╒     #
#                     #
#                     #
###########◙###########
##########   ##########
#########     #########\
`;

/*
#  equip compass   ¢  #
#  pick up sword   /  #
#  destroy chest   ╒  #
# A:\\>alive.exe       #
█    pick up sword    █
█    destroy chest    █
█    collect a key    █
█    open the door    █
█    equip compass    █
█    set character    █
*/
