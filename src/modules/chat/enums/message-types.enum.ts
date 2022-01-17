export enum MessageTypes {
  user = 'user',
  system = 'system',
  userNewTicket = 'userNewTicket',
  priorityChanged = 'priorityChanged',
  userNewProcurement = 'userNewProcurement',
  procurementOpened = 'procurementOpened',
  procurementInProgress = 'procurementInProgress',
  procurementProposalAccepted = 'procurementProposalAccepted',
  procurementProposalRejected = 'procurementProposalRejected',
  procurementProposalCanceled = 'procurementProposalCanceled',
  procurementClosed = 'procurementClosed',
  procurementWorkStarted = 'procurementWorkStarted',
  procurementWorkFinished = 'procurementWorkFinished',
  procurementWorkRejected = 'procurementWorkRejected',
  procurementWorkAccepted = 'procurementWorkAccepted',
  procurementProposalSubmitted = 'procurementProposalSubmitted',
  procurementStatusChange = 'procurementStatusChange',
  ticketResolved = 'ticketResolved',
  ticketAccepted = 'ticketAccepted',
  ticketRejected = 'ticketRejected',
  ticketOnHold = 'ticketOnHold',
  ticketOpened = 'ticketOpened',
  ticketReopened = 'ticketReopened',
  ticketClosed = 'ticketClosed',
  systemTicketClosed = 'systemTicketClosed',
  systemProcurementClosed = 'systemProcurementClosed',
  systemUserJoinedChat = 'systemUserJoinedChat',
  systemUserLeftChat = 'systemUserLeftChat',
  systemMessageDeleted = 'systemMessageDeleted',
}