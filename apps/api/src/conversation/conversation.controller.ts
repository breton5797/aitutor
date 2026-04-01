import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConversationService } from './conversation.service';
import { CreateConversationDto, SendMessageDto } from './dto/conversation.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('conversations')
export class ConversationController {
  constructor(private conversationService: ConversationService) {}

  @Get()
  getConversations(@Request() req: any) {
    return this.conversationService.getConversations(req.user.id);
  }

  @Post()
  createConversation(@Request() req: any, @Body() dto: CreateConversationDto) {
    return this.conversationService.createConversation(req.user.id, dto);
  }

  @Get(':id/messages')
  getMessages(@Request() req: any, @Param('id') id: string) {
    return this.conversationService.getMessages(req.user.id, id);
  }

  @Post(':id/messages')
  sendMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationService.sendMessage(req.user.id, id, dto);
  }
}
