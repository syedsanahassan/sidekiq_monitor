module Sidekiq
  module Monitor
    module Client
      class Middleware
        def initialize(options=nil)
          @processor = Monitor::Processor.new
          @options = options
        end

        def call(worker_class, item, queue, redis_pool=nil)
          ActiveRecord::Base.connection_pool.with_connection do
            if @options.present? &&
                @options[:options].present? &&
                @options[:options][:ignore_jobs].present? &&
                @options[:options][:ignore_jobs].exclude?(worker_class.to_s)
              @processor.queue(worker_class, item, queue)
            else
              item
            end
            yield
          end
        end
      end
    end
  end
end
